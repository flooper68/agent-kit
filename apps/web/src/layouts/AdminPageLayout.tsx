import { useState, useCallback, useMemo } from 'react';
import {
  useUser,
  useClerk,
  useOrganization,
  useOrganizationList,
} from '@clerk/clerk-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout, ProjectSwitcher } from '@agent-kit/ui';
import type { Project, MenuSection } from '@agent-kit/ui';
import { Bot, BarChart3, Users } from 'lucide-react';
import { checkIsAdmin } from '../lib/auth';

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
  const [isSwitching, setIsSwitching] = useState(false);
  const isAdmin = checkIsAdmin(membership?.role);
  const currentPath = location.pathname;

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
      }}
    >
      {children}
    </AppLayout>
  );
}
