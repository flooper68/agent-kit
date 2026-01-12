import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  useUser,
  useClerk,
  useOrganization,
  useOrganizationList,
} from '@clerk/clerk-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  TaskHistoryItem,
} from '@agent-kit/ui';
import {
  Bot,
  BarChart3,
  Users,
  FileText,
  FolderKanban,
  Home,
  BookOpen,
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
import {
  AgentSelectionProvider,
  useAgentSelection,
} from '../contexts/AgentSelectionContext';
import { trpc } from '../lib/trpc';
import { AppAgentPanel } from '../components/AppAgentPanel';
import { AppCommandPalette } from '../components/AppCommandPalette';

const PANEL_WIDTH_STORAGE_KEY = 'agent-kit-panel-width';

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

function DashboardLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine layout mode based on route
  const isHomePage = location.pathname === '/app';
  // Always show the side panel to keep a single AppAgentPanel instance across routes
  const showSidePanel = true;
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
      if (showSidePanel) {
        handleExpandPanel();
      }
      // Always request input focus (works on home page and side panel pages)
      requestInputFocus();
    },
    [setSelectedAgentId, showSidePanel, handleExpandPanel, requestInputFocus]
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

  // Fetch recent chats for home page display
  const { sessions: recentChats, refetch: refetchRecentChats } = useChatHistory(
    {
      limit: 3,
    }
  );

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

  // Map server agents to UI AgentType format
  const agents: AgentType[] = useMemo(() => {
    return (agentsQuery.data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      isLocal: agent.isLocal,
      isFavorite: agent.isFavorite,
      model: agent.model ?? undefined,
      provider: agent.provider ?? undefined,
      // External agents are disabled when not connected (server agents are always enabled)
      disabled: false,
    }));
  }, [agentsQuery.data]);

  // Delete session mutation
  const deleteSessionMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      refetchSessions();
      refetchRecentChats();
    },
  });

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      setSessionId(sessionId);
      setIsHistoryOpen(false);
    },
    [setSessionId]
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

  // Handlers for recent chats on home page
  const handleRecentChatClick = useCallback(
    (chat: TaskHistoryItem) => {
      setSessionId(chat.id);
    },
    [setSessionId]
  );

  const handleRecentChatDelete = useCallback(
    async (chat: TaskHistoryItem) => {
      try {
        await deleteSessionMutation.mutateAsync({ sessionId: chat.id });
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [deleteSessionMutation]
  );

  const handleNewSession = useCallback(() => {
    clearSession();
    if (showSidePanel) {
      handleExpandPanel();
    }
  }, [clearSession, showSidePanel, handleExpandPanel]);

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
                  label: 'External Agents',
                  icon: <Bot className="h-4 w-4" />,
                  onClick: () => navigate('/app/agents'),
                  active: currentPath.startsWith('/app/agents'),
                },
                {
                  id: 'skills',
                  label: 'Skills',
                  icon: <BookOpen className="h-4 w-4" />,
                  onClick: () => navigate('/app/skills'),
                  active: currentPath.startsWith('/app/skills'),
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
              <Tooltip content="External Agents">
                <IconButton
                  icon={<Bot className="h-4 w-4" />}
                  label="External Agents"
                  onClick={() => navigate('/app/agents')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath.startsWith('/app/agents')
                      ? 'bg-accent text-accent-foreground'
                      : undefined
                  }
                />
              </Tooltip>
              <Tooltip content="Skills">
                <IconButton
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Skills"
                  onClick={() => navigate('/app/skills')}
                  variant="ghost"
                  size="sm"
                  className={
                    currentPath.startsWith('/app/skills')
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
        panelConfig={{
          defaultWidth: panelWidth,
          minWidth: 300,
          maxWidth: 1200,
          defaultCollapsed: false,
        }}
        panelWidth={panelWidth}
        onPanelWidthChange={handlePanelWidthChange}
        // On home page: hide main + resizer, make panel full width
        className={
          isHomePage
            ? '[&>div>main]:hidden [&>div>div:nth-child(2)]:hidden [&>div>div:first-child]:!w-full [&>div>div:first-child>div]:!w-full'
            : undefined
        }
        panelToggleDisabled={isHomePage}
        assistantPanel={
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
            // Only show recentChats on home page
            recentChats={isHomePage ? recentChats : undefined}
            onRecentChatClick={isHomePage ? handleRecentChatClick : undefined}
            onRecentChatDelete={isHomePage ? handleRecentChatDelete : undefined}
          />
        }
      >
        {isHomePage ? null : <Outlet />}
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
        onTogglePanel={showSidePanel ? handleTogglePanel : undefined}
        onSetPanelWidth={showSidePanel ? handleSetPanelWidth : undefined}
        onExpandPanel={showSidePanel ? handleExpandPanel : undefined}
        onToggleHistory={handleToggleHistory}
        agents={agents}
        onAgentSelect={handleAgentSelectFromPalette}
        isAgentSelectorEnabled={!sessionId}
      />
    </>
  );
}

export function DashboardLayout() {
  return (
    <ToastProvider>
      <AgentSelectionProvider>
        <CommandRegistryProvider>
          <HeaderActionsProvider>
            <DashboardLayoutInner />
          </HeaderActionsProvider>
        </CommandRegistryProvider>
      </AgentSelectionProvider>
    </ToastProvider>
  );
}
