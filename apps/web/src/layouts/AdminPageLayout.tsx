import { useState, useCallback, useMemo } from 'react';
import {
  useUser,
  useClerk,
  useOrganization,
  useOrganizationList,
} from '@clerk/clerk-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  AppLayout,
  ProjectSwitcher,
  HistoryToggleButton,
  CommandPaletteButton,
  NewTaskButton,
  TaskHistorySidebar,
  IconButton,
  Tooltip,
} from '@agent-kit/ui';
import type { Project, MenuSection, SessionFilter } from '@agent-kit/ui';
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
import { trpc } from '../lib/trpc';
import { AppCommandPalette } from '../components/AppCommandPalette';
import { CommandRegistryProvider } from '../contexts/CommandRegistryContext';

interface AdminPageLayoutProps {
  children: React.ReactNode;
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization, membership } = useOrganization();
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const { setSessionId, clearSession } = useSession();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<SessionFilter>('my_chats');
  const isAdmin = checkIsAdmin(membership?.role);
  const currentPath = location.pathname;

  // Register Cmd+P / Ctrl+P keyboard shortcut for command palette
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useGlobalKeyboardShortcut('p', openCommandPalette, { cmdOrCtrl: true });

  // Fetch chat history for the sidebar
  const { sessions, refetch: refetchSessions } = useChatHistory({
    limit: 50,
    filter: historyFilter,
  });

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
    navigate('/app');
  }, [clearSession, navigate]);

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

  // Redirect non-admin users to dashboard
  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <CommandRegistryProvider>
      <AppLayout
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
          ] as MenuSection[],
          onSignOut: () => signOut(),
        }}
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
        }}
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
      />
      <AppCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
    </CommandRegistryProvider>
  );
}
