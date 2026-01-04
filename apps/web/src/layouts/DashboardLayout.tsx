import { useState, useCallback, useMemo, useRef } from 'react';
import {
  useUser,
  useClerk,
  useOrganization,
  useOrganizationList,
} from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppLayout,
  ProjectSwitcher,
  HistoryToggleButton,
  CommandPaletteButton,
  NewTaskButton,
  TaskHistorySidebar,
  IconButton,
  Tooltip,
  Button,
  ToastProvider,
} from '@agent-kit/ui';
import type { Project, MenuSection, AgentType, AppLayoutRef } from '@agent-kit/ui';
import {
  Bot,
  BarChart3,
  Users,
  FileText,
  FolderKanban,
  Home,
} from 'lucide-react';
import { checkIsAdmin } from '../lib/auth';
import { useChatHistory } from '../hooks/useChatHistory';
import { useGlobalKeyboardShortcut } from '../hooks/useGlobalKeyboardShortcut';
import { useSession } from '../contexts/SessionContext';
import {
  HeaderActionsProvider,
  useHeaderActions,
} from '../contexts/HeaderActionsContext';
import { CommandRegistryProvider } from '../contexts/CommandRegistryContext';
import { trpc } from '../lib/trpc';
import { AppAgentPanel } from '../components/AppAgentPanel';
import { AppCommandPalette } from '../components/AppCommandPalette';

const PANEL_WIDTH_STORAGE_KEY = 'agent-kit-panel-width';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Show the agent panel alongside the main content */
  showAgentPanel?: boolean;
}

function getDefaultPanelWidth(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Default to 50% of viewport width
  return Math.round(window.innerWidth * 0.5);
}

function DashboardLayoutInner({
  children,
  showAgentPanel = false,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization, membership } = useOrganization();
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const { setSessionId, clearSession } = useSession();
  const { actions: headerActions, menuItems: headerMenuItems } =
    useHeaderActions();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(getDefaultPanelWidth);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const appLayoutRef = useRef<AppLayoutRef>(null);
  const isAdmin = checkIsAdmin(membership?.role);
  const currentPath = location.pathname;

  // Save panel width to localStorage when it changes
  const handlePanelWidthChange = useCallback((width: number) => {
    setPanelWidth(width);
    localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(width));
  }, []);

  // Handle panel toggle from command palette
  const handleTogglePanel = useCallback(() => {
    appLayoutRef.current?.togglePanel();
  }, []);

  // Handle panel width change from command palette
  const handleSetPanelWidth = useCallback(
    (width: number) => {
      appLayoutRef.current?.setPanelWidth(width);
      handlePanelWidthChange(width);
    },
    [handlePanelWidthChange]
  );

  // Register Cmd+P keyboard shortcut for command palette
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useGlobalKeyboardShortcut('p', openCommandPalette, { metaKey: true });

  // Fetch chat history for the sidebar
  const { sessions, refetch: refetchSessions } = useChatHistory({ limit: 50 });

  // Fetch agents for the agent panel (only when showAgentPanel is true)
  const agentsQuery = trpc.agents.list.useQuery(undefined, {
    enabled: showAgentPanel,
  });

  // Map server agents to UI AgentType format
  const agents: AgentType[] = useMemo(() => {
    return (agentsQuery.data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      tools: agent.tools,
      model: agent.model,
      provider: agent.provider,
    }));
  }, [agentsQuery.data]);

  // Delete session mutation
  const deleteSessionMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      refetchSessions();
    },
  });

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      setSessionId(sessionId);
      setIsHistoryOpen(false);
      navigate('/app');
    },
    [setSessionId, navigate]
  );

  const handleSessionDelete = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSessionMutation.mutateAsync({ sessionId });
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [deleteSessionMutation]
  );

  const handleNewSession = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const projects: Project[] = useMemo(() => {
    if (!userMemberships?.data) return [];
    return userMemberships.data.map(({ organization: org }) => ({
      id: org.id,
      name: org.name,
      avatarUrl: org.imageUrl,
      avatarFallback: org.name.charAt(0).toUpperCase(),
    }));
  }, [userMemberships?.data]);

  const currentProject: Project | null = useMemo(() => {
    if (!organization) return null;
    return {
      id: organization.id,
      name: organization.name,
      avatarUrl: organization.imageUrl,
      avatarFallback: organization.name.charAt(0).toUpperCase(),
    };
  }, [organization]);

  const handleProjectSelect = useCallback(
    async (projectId: string) => {
      if (isSwitching) return;
      setIsSwitching(true);
      try {
        await setActive?.({ organization: projectId });
      } finally {
        setIsSwitching(false);
      }
    },
    [isSwitching, setActive]
  );

  return (
    <>
      <AppLayout
        ref={appLayoutRef}
        mainMenu={{
          appName: 'Agent Kit',
          appIcon: <Bot className="h-4 w-4" />,
          showThemeToggle: true,
          profile: {
            name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress,
            email: user?.primaryEmailAddress?.emailAddress,
            avatarSrc: user?.imageUrl,
          },
          sections: [
            {
              id: 'navigation',
              items: [
                {
                  id: 'home',
                  label: 'Home',
                  icon: <Home className="h-4 w-4" />,
                  onClick: () => navigate('/app'),
                  active: currentPath === '/app',
                },
                {
                  id: 'agents',
                  label: 'Agents',
                  icon: <Bot className="h-4 w-4" />,
                  onClick: () => navigate('/app'),
                  active: currentPath === '/app',
                },
                {
                  id: 'artifacts',
                  label: 'Artifacts',
                  icon: <FileText className="h-4 w-4" />,
                  onClick: () => navigate('/app/artifacts'),
                  active: currentPath === '/app/artifacts',
                },
                {
                  id: 'projects',
                  label: 'Projects',
                  icon: <FolderKanban className="h-4 w-4" />,
                  onClick: () => navigate('/app/projects'),
                  active: currentPath.startsWith('/app/projects'),
                },
              ],
            },
            ...(isAdmin
              ? [
                  {
                    id: 'admin',
                    items: [
                      {
                        id: 'analytics',
                        label: 'Analytics',
                        icon: <BarChart3 className="h-4 w-4" />,
                        onClick: () => navigate('/app/analytics'),
                        active: currentPath === '/app/analytics',
                      },
                      {
                        id: 'users',
                        label: 'Users',
                        icon: <Users className="h-4 w-4" />,
                        onClick: () => navigate('/app/users'),
                        active: currentPath === '/app/users',
                      },
                    ],
                  },
                ]
              : []),
          ] as MenuSection[],
          onSignOut: () => signOut(),
        }}
        moreMenu={
          headerMenuItems.length > 0
            ? {
                items: headerMenuItems.map((item) => ({
                  id: item.id,
                  label: item.label,
                  icon: item.icon,
                  onClick: item.onClick,
                  danger: item.danger,
                  disabled: item.disabled,
                })),
              }
            : undefined
        }
        headerSlots={{
          projectSwitcher:
            isLoaded && currentProject ? (
              <ProjectSwitcher
                projects={projects}
                currentProject={currentProject}
                onSelect={handleProjectSelect}
                isLoading={isSwitching}
              />
            ) : null,
          toolButtons: (
            <>
              <CommandPaletteButton
                onClick={() => setIsCommandPaletteOpen(true)}
              />
              <HistoryToggleButton onClick={() => setIsHistoryOpen(true)} />
              <NewTaskButton onClick={handleNewSession} />
            </>
          ),
          navigation: (
            <>
              <Tooltip content="Home">
                <IconButton
                  icon={<Home className="h-4 w-4" />}
                  label="Home"
                  onClick={() => navigate('/app')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath === '/app'
                      ? 'bg-accent text-accent-foreground'
                      : undefined
                  }
                />
              </Tooltip>
              <Tooltip content="Artifacts">
                <IconButton
                  icon={<FileText className="h-4 w-4" />}
                  label="Artifacts"
                  onClick={() => navigate('/app/artifacts')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath === '/app/artifacts'
                      ? 'bg-accent text-accent-foreground'
                      : undefined
                  }
                />
              </Tooltip>
              <Tooltip content="Projects">
                <IconButton
                  icon={<FolderKanban className="h-4 w-4" />}
                  label="Projects"
                  onClick={() => navigate('/app/projects')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath.startsWith('/app/projects')
                      ? 'bg-accent text-accent-foreground'
                      : undefined
                  }
                />
              </Tooltip>
            </>
          ),
          primaryAction:
            headerActions.length > 0 ? (
              <div className="flex items-center gap-2">
                {headerActions.map((action) => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.variant || 'primary'}
                    onClick={action.onClick}
                  >
                    {action.icon && (
                      <span className="mr-1.5">{action.icon}</span>
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : undefined,
        }}
        panelConfig={
          showAgentPanel
            ? {
                defaultWidth: panelWidth,
                minWidth: 300,
                maxWidth: 1200,
                defaultCollapsed: false,
              }
            : undefined
        }
        panelWidth={panelWidth}
        onPanelWidthChange={handlePanelWidthChange}
        assistantPanel={
          showAgentPanel ? (
            <AppAgentPanel
              agents={agents}
              onNewChat={handleNewSession}
              emptyStateConfig={{
                title: 'How can I help?',
                description:
                  'Ask me anything or try one of the suggestions below.',
              }}
              suggestions={[
                { id: '1', text: 'What time is it?' },
                { id: '2', text: 'Tell me a joke' },
                { id: '3', text: 'Help me with code' },
              ]}
            />
          ) : undefined
        }
      >
        {children}
      </AppLayout>
      <TaskHistorySidebar
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        tasks={sessions}
        onTaskSelect={handleSessionSelect}
        onTaskDelete={handleSessionDelete}
      />
      <AppCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onTogglePanel={showAgentPanel ? handleTogglePanel : undefined}
        onSetPanelWidth={showAgentPanel ? handleSetPanelWidth : undefined}
      />
    </>
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <ToastProvider>
      <CommandRegistryProvider>
        <HeaderActionsProvider>
          <DashboardLayoutInner {...props} />
        </HeaderActionsProvider>
      </CommandRegistryProvider>
    </ToastProvider>
  );
}
