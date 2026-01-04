import { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CommandPalette, useTheme, type Command } from '@agent-kit/ui';
import {
  Plus,
  FileText,
  Home,
  FolderKanban,
  History,
  BarChart3,
  Users,
  Moon,
  Sun,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Folder,
  PanelLeft,
  Columns2,
} from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { useChatHistory } from '../hooks/useChatHistory';
import { useCommandRegistry } from '../contexts/CommandRegistryContext';
import { trpc } from '../lib/trpc';

const USAGE_STORAGE_KEY = 'agent-kit:command-palette-usage';

interface CommandUsage {
  [commandId: string]: number; // timestamp of last use
}

function getStoredUsage(): CommandUsage {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      // Validate structure: must be a non-array object
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Filter to only valid entries (string keys with number values)
        const validated: CommandUsage = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'number') {
            validated[key] = value;
          }
        }
        return validated;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveUsage(usage: CommandUsage): void {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

type PaletteMode = 'commands' | 'chats' | 'projects';

interface AppCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePanel?: () => void;
  onSetPanelWidth?: (width: number) => void;
  onExpandPanel?: () => void;
}

export function AppCommandPalette({
  open,
  onOpenChange,
  onTogglePanel,
  onSetPanelWidth,
  onExpandPanel,
}: AppCommandPaletteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, setSessionId, clearSession } = useSession();
  const { sessions } = useChatHistory({ limit: 50 });
  const { resolvedTheme, setTheme } = useTheme();
  const { commands: registeredCommands } = useCommandRegistry();
  const [usage, setUsage] = useState<CommandUsage>(getStoredUsage);
  const [mode, setMode] = useState<PaletteMode>('commands');

  // Fetch projects
  const projectsQuery = trpc.projects.list.useQuery({ limit: 50 });
  const projects = useMemo(
    () => projectsQuery.data?.items ?? [],
    [projectsQuery.data?.items]
  );

  // Check if we should navigate when opening a chat
  const shouldNavigateOnChatOpen = useMemo(() => {
    const path = location.pathname;
    // Don't navigate away from projects or artifacts pages
    return (
      !path.startsWith('/app/projects') && !path.startsWith('/app/artifacts')
    );
  }, [location.pathname]);

  // Reset mode when palette closes
  useEffect(() => {
    if (!open) {
      setMode('commands');
    }
  }, [open]);

  // Reload usage from storage when palette opens
  useEffect(() => {
    if (open) {
      setUsage(getStoredUsage());
    }
  }, [open]);

  const trackUsage = useCallback((commandId: string) => {
    setUsage((prev) => {
      const updated = { ...prev, [commandId]: Date.now() };
      saveUsage(updated);
      return updated;
    });
  }, []);

  // Find previous chat (last updated before current, or latest if none active)
  const previousChat = useMemo(() => {
    if (!sessions.length) return null;

    if (!sessionId) {
      return sessions[0] ?? null;
    }

    const currentIndex = sessions.findIndex((s) => s.id === sessionId);
    if (currentIndex === -1) {
      return sessions[0] ?? null;
    }

    return sessions[currentIndex + 1] ?? sessions[0] ?? null;
  }, [sessions, sessionId]);

  // Chat selection commands (for two-step flow)
  const chatCommands = useMemo<Command[]>(() => {
    return sessions.map((chat) => ({
      id: `chat-${chat.id}`,
      label: chat.title,
      description: chat.updatedAt
        ? `Last active ${chat.updatedAt.toLocaleDateString()}`
        : undefined,
      icon: <MessageSquare className="h-4 w-4" />,
      keywords: [chat.title.toLowerCase()],
      onSelect: () => {
        trackUsage('open-chat');
        setSessionId(chat.id);
        if (shouldNavigateOnChatOpen) {
          navigate('/app');
        }
      },
    }));
  }, [sessions, setSessionId, navigate, trackUsage, shouldNavigateOnChatOpen]);

  // Project selection commands (for two-step flow)
  const projectCommands = useMemo<Command[]>(() => {
    return projects.map((project) => ({
      id: `project-${project.id}`,
      label: project.title,
      description: project.summary || undefined,
      icon: <Folder className="h-4 w-4" />,
      keywords: [project.title.toLowerCase()],
      onSelect: () => {
        trackUsage('open-project');
        navigate(`/app/projects/${project.id}`);
      },
    }));
  }, [projects, navigate, trackUsage]);

  const baseCommands = useMemo<Command[]>(
    () => [
      {
        id: 'new-chat',
        label: 'Create new chat',
        description: 'Start a fresh conversation',
        icon: <Plus className="h-4 w-4" />,
        keywords: ['new', 'chat', 'conversation', 'create'],
        onSelect: () => {
          trackUsage('new-chat');
          clearSession();
          onExpandPanel?.();
          if (shouldNavigateOnChatOpen) {
            navigate('/app');
          }
        },
      },
      {
        id: 'open-chat',
        label: 'Open chat...',
        description: 'Select from recent chats',
        icon: <MessageSquare className="h-4 w-4" />,
        keywords: ['open', 'chat', 'select', 'switch', 'conversation'],
        disabled: sessions.length === 0,
        keepOpen: true,
        onSelect: () => {
          trackUsage('open-chat');
          setMode('chats');
        },
      },
      {
        id: 'open-project',
        label: 'Open project...',
        description: 'Select from your projects',
        icon: <Folder className="h-4 w-4" />,
        keywords: ['open', 'project', 'select', 'switch'],
        disabled: projects.length === 0,
        keepOpen: true,
        onSelect: () => {
          trackUsage('open-project');
          setMode('projects');
        },
      },
      {
        id: 'nav-home',
        label: 'Navigate to home',
        description: 'Go to the dashboard',
        icon: <Home className="h-4 w-4" />,
        keywords: ['home', 'dashboard', 'main'],
        onSelect: () => {
          trackUsage('nav-home');
          navigate('/app');
        },
      },
      {
        id: 'nav-artifacts',
        label: 'Navigate to artifacts',
        description: 'View all artifacts',
        icon: <FileText className="h-4 w-4" />,
        keywords: ['artifacts', 'files', 'documents'],
        onSelect: () => {
          trackUsage('nav-artifacts');
          navigate('/app/artifacts');
        },
      },
      {
        id: 'nav-projects',
        label: 'Navigate to projects',
        description: 'View all projects',
        icon: <FolderKanban className="h-4 w-4" />,
        keywords: ['projects', 'kanban', 'tasks'],
        onSelect: () => {
          trackUsage('nav-projects');
          navigate('/app/projects');
        },
      },
      {
        id: 'nav-analytics',
        label: 'Navigate to analytics',
        description: 'View usage analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        keywords: ['analytics', 'stats', 'metrics', 'usage'],
        onSelect: () => {
          trackUsage('nav-analytics');
          navigate('/app/analytics');
        },
      },
      {
        id: 'nav-users',
        label: 'Navigate to users',
        description: 'Manage team members',
        icon: <Users className="h-4 w-4" />,
        keywords: ['users', 'team', 'members', 'settings'],
        onSelect: () => {
          trackUsage('nav-users');
          navigate('/app/users');
        },
      },
      {
        id: 'toggle-theme',
        label: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`,
        description: `Currently in ${resolvedTheme} mode`,
        icon:
          resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          ),
        keywords: ['theme', 'dark', 'light', 'mode', 'toggle', 'appearance'],
        onSelect: () => {
          trackUsage('toggle-theme');
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id: 'open-previous-chat',
        label: 'Open previous chat',
        description: previousChat
          ? `Open "${previousChat.title}"`
          : 'No previous chat available',
        icon: <History className="h-4 w-4" />,
        keywords: ['previous', 'last', 'recent', 'chat', 'history'],
        disabled: !previousChat,
        onSelect: () => {
          if (previousChat) {
            trackUsage('open-previous-chat');
            setSessionId(previousChat.id);
            if (shouldNavigateOnChatOpen) {
              navigate('/app');
            }
          }
        },
      },
      {
        id: 'go-back',
        label: 'Go back',
        description: 'Navigate to previous page',
        icon: <ArrowLeft className="h-4 w-4" />,
        keywords: ['back', 'previous', 'history', 'navigate'],
        onSelect: () => {
          trackUsage('go-back');
          navigate(-1);
        },
      },
      {
        id: 'go-forward',
        label: 'Go forward',
        description: 'Navigate to next page',
        icon: <ArrowRight className="h-4 w-4" />,
        keywords: ['forward', 'next', 'history', 'navigate'],
        onSelect: () => {
          trackUsage('go-forward');
          navigate(1);
        },
      },
      ...(onTogglePanel
        ? [
            {
              id: 'toggle-panel',
              label: 'Toggle chat panel',
              description: 'Show or hide the assistant panel',
              icon: <PanelLeft className="h-4 w-4" />,
              keywords: ['panel', 'toggle', 'show', 'hide', 'sidebar', 'chat'],
              onSelect: () => {
                trackUsage('toggle-panel');
                onTogglePanel();
              },
            },
          ]
        : []),
      ...(onSetPanelWidth
        ? [
            {
              id: 'panel-50-50',
              label: 'Split panel 50/50',
              description: 'Equal width for content and panel',
              icon: <Columns2 className="h-4 w-4" />,
              keywords: ['panel', 'split', 'equal', 'half', 'align', '50'],
              onSelect: () => {
                trackUsage('panel-50-50');
                onSetPanelWidth(Math.round(window.innerWidth * 0.5));
              },
            },
            {
              id: 'panel-40-60',
              label: 'Split panel 40/60',
              description: 'Wider content, narrower panel',
              icon: <Columns2 className="h-4 w-4" />,
              keywords: ['panel', 'split', 'align', '40', '60'],
              onSelect: () => {
                trackUsage('panel-40-60');
                onSetPanelWidth(Math.round(window.innerWidth * 0.4));
              },
            },
          ]
        : []),
    ],
    [
      navigate,
      clearSession,
      setSessionId,
      previousChat,
      resolvedTheme,
      setTheme,
      trackUsage,
      sessions.length,
      projects.length,
      shouldNavigateOnChatOpen,
      onTogglePanel,
      onSetPanelWidth,
      onExpandPanel,
    ]
  );

  // Merge base commands with registered commands and sort by most recently used
  const sortedBaseCommands = useMemo(() => {
    const allCommands = [...baseCommands, ...registeredCommands];
    return allCommands.sort((a, b) => {
      const aUsage = usage[a.id] ?? 0;
      const bUsage = usage[b.id] ?? 0;
      return bUsage - aUsage; // Most recent first
    });
  }, [baseCommands, registeredCommands, usage]);

  // Choose commands based on mode
  const commands = useMemo(() => {
    switch (mode) {
      case 'chats':
        return chatCommands;
      case 'projects':
        return projectCommands;
      default:
        return sortedBaseCommands;
    }
  }, [mode, chatCommands, projectCommands, sortedBaseCommands]);

  const placeholder = useMemo(() => {
    switch (mode) {
      case 'chats':
        return 'Search chats...';
      case 'projects':
        return 'Search projects...';
      default:
        return 'Search commands...';
    }
  }, [mode]);

  const emptyMessage = useMemo(() => {
    switch (mode) {
      case 'chats':
        return 'No chats found.';
      case 'projects':
        return 'No projects found.';
      default:
        return 'No commands found.';
    }
  }, [mode]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      commands={commands}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
    />
  );
}
