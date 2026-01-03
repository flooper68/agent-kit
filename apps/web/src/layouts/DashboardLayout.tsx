import { useState, useCallback, useMemo } from 'react';
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
  NewTaskButton,
  TaskHistorySidebar,
} from '@agent-kit/ui';
import type { Project, MenuSection } from '@agent-kit/ui';
import { Bot, BarChart3, Users } from 'lucide-react';
import { checkIsAdmin } from '../lib/auth';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSession } from '../contexts/SessionContext';
import { trpc } from '../lib/trpc';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
  const isAdmin = checkIsAdmin(membership?.role);
  const currentPath = location.pathname;

  // Fetch chat history for the sidebar
  const { sessions, refetch: refetchSessions } = useChatHistory({ limit: 50 });

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
        mainMenu={{
          appName: 'Agent Kit',
          appIcon: <Bot className="h-4 w-4" />,
          showThemeToggle: true,
          profile: {
            name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress,
            email: user?.primaryEmailAddress?.emailAddress,
            avatarSrc: user?.imageUrl,
          },
          sections: (isAdmin
            ? [
                {
                  id: 'navigation',
                  items: [
                    {
                      id: 'agents',
                      label: 'Agents',
                      icon: <Bot className="h-4 w-4" />,
                      onClick: () => navigate('/app'),
                      active: currentPath === '/app',
                    },
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
            : []) as MenuSection[],
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
              <NewTaskButton onClick={handleNewSession} />
              <HistoryToggleButton onClick={() => setIsHistoryOpen(true)} />
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
      />
    </>
  );
}
