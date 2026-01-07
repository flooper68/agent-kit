import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import type {
  Project,
  MenuSection,
  AgentType,
  AppLayoutRef,
  SessionFilter,
} from '@agent-kit/ui';
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
import { useLocalAgentConnectionStatus } from '../hooks/useCacheInvalidation';
import { useGlobalKeyboardShortcut } from '../hooks/useGlobalKeyboardShortcut';
import { useSession } from '../contexts/SessionContext';
import {
  HeaderActionsProvider,
  useHeaderActions,
} from '../contexts/HeaderActionsContext';
import { CommandRegistryProvider } from '../contexts/CommandRegistryContext';
import {
  AgentSelectionProvider,
  useAgentSelection,
} from '../contexts/AgentSelectionContext';
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
  const { sessionId, setSessionId, clearSession } = useSession();
  const { actions: headerActions, menuItems: headerMenuItems } =
    useHeaderActions();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(getDefaultPanelWidth);
  const [historyFilter, setHistoryFilter] = useState<SessionFilter>('my_chats');
  const [historyCursors, setHistoryCursors] = useState<string[]>([]);
  const currentHistoryCursor = historyCursors[historyCursors.length - 1];
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const {
    selectedAgentId,
    setSelectedAgentId,
    pendingInputFocus,
    requestInputFocus,
    clearInputFocus,
  } = useAgentSelection();
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

  // Handle panel expand (open if collapsed)
  const handleExpandPanel = useCallback(() => {
    if (appLayoutRef.current?.isPanelCollapsed()) {
      appLayoutRef.current?.expandPanel();
    }
  }, []);

  // Handle panel width change from command palette
  const handleSetPanelWidth = useCallback(
    (width: number) => {
      appLayoutRef.current?.setPanelWidth(width);
      handlePanelWidthChange(width);
    },
    [handlePanelWidthChange]
  );

  // Handle toggle history from command palette
  const handleToggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
  }, []);

  // Handle agent selection from command palette
  const handleAgentSelectFromPalette = useCallback(
    (agent: AgentType) => {
      setSelectedAgentId(agent.id);
      // Expand panel if on a page with side panel
      if (showAgentPanel) {
        handleExpandPanel();
      }
      // Always request input focus (works on home page and side panel pages)
      requestInputFocus();
    },
    [setSelectedAgentId, showAgentPanel, handleExpandPanel, requestInputFocus]
  );

  // Clear pending focus flag
  const handleInputFocused = useCallback(() => {
    clearInputFocus();
  }, [clearInputFocus]);

  // Register Cmd+P / Ctrl+P keyboard shortcut for command palette
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useGlobalKeyboardShortcut('p', openCommandPalette, { cmdOrCtrl: true });

  // Fetch chat history for the sidebar
  const {
    sessions,
    refetch: refetchSessions,
    nextCursor: historyNextCursor,
    isFetching: isHistoryFetching,
    totalCount: historyTotalCount,
  } = useChatHistory({
    limit: 20,
    filter: historyFilter,
    cursor: currentHistoryCursor,
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setHistoryCursors([]);
  }, [historyFilter]);

  // Pagination handlers
  const handleHistoryNextPage = useCallback(() => {
    if (historyNextCursor) {
      setHistoryCursors((prev) => [...prev, historyNextCursor]);
    }
  }, [historyNextCursor]);

  const handleHistoryPreviousPage = useCallback(() => {
    setHistoryCursors((prev) => prev.slice(0, -1));
  }, []);

  // Fetch agents for the agent panel and command palette
  const agentsQuery = trpc.agents.list.useQuery();

  // Track local agent connection status
  const hasLocalAgents = agentsQuery.data?.some((a) => a.isLocal) ?? false;
  const localAgentConnectionStatus =
    useLocalAgentConnectionStatus(hasLocalAgents);

  // Map server agents to UI AgentType format (with disabled state for disconnected local agents)
  const agents: AgentType[] = useMemo(() => {
    return (agentsQuery.data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      isLocal: agent.isLocal,
      // Local agents are disabled when not connected
      disabled: agent.isLocal
        ? !localAgentConnectionStatus.get(agent.id)
        : false,
      // Built-in agents have tools, model, provider; local agents don't
      ...(agent.isLocal
        ? {}
        : {
            tools: agent.tools,
            model: agent.model,
            provider: agent.provider,
          }),
    }));
  }, [agentsQuery.data, localAgentConnectionStatus]);

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
    handleExpandPanel();
  }, [clearSession, handleExpandPanel]);

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
                  label: 'Local Agents',
                  icon: <Bot className="h-4 w-4" />,
                  onClick: () => navigate('/app/agents'),
                  active: currentPath === '/app/agents',
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
              <Tooltip content="Local Agents">
                <IconButton
                  icon={<Bot className="h-4 w-4" />}
                  label="Local Agents"
                  onClick={() => navigate('/app/agents')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath === '/app/agents'
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
              selectedAgentId={selectedAgentId}
              onAgentSelect={handleAgentSelectFromPalette}
              onNewChat={handleNewSession}
              pendingInputFocus={pendingInputFocus}
              onInputFocused={handleInputFocused}
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
        filter={historyFilter}
        onFilterChange={setHistoryFilter}
        hasNextPage={!!historyNextCursor}
        hasPreviousPage={historyCursors.length > 0}
        onNextPage={handleHistoryNextPage}
        onPreviousPage={handleHistoryPreviousPage}
        isPaginationLoading={isHistoryFetching}
        totalCount={historyTotalCount}
      />
      <AppCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onTogglePanel={showAgentPanel ? handleTogglePanel : undefined}
        onSetPanelWidth={showAgentPanel ? handleSetPanelWidth : undefined}
        onExpandPanel={showAgentPanel ? handleExpandPanel : undefined}
        onToggleHistory={handleToggleHistory}
        agents={agents}
        onAgentSelect={handleAgentSelectFromPalette}
        isAgentSelectorEnabled={!sessionId}
      />
    </>
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <ToastProvider>
      <AgentSelectionProvider>
        <CommandRegistryProvider>
          <HeaderActionsProvider>
            <DashboardLayoutInner {...props} />
          </HeaderActionsProvider>
        </CommandRegistryProvider>
      </AgentSelectionProvider>
    </ToastProvider>
  );
}
