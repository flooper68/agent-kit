import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ClerkProvider } from '../providers/ClerkProvider';
import { TRPCProvider } from '../providers/TRPCProvider';
import { SessionProvider } from '../contexts/SessionContext';
import { RootLayout } from '../layouts/RootLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProtectedLayout } from '../layouts/ProtectedLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminPageLayout } from '../layouts/AdminPageLayout';
import {
  LandingPageSkeleton,
  SignInPageSkeleton,
  SignUpPageSkeleton,
  SSOCallbackSkeleton,
  SettingsPageSkeleton,
  AnalyticsPageSkeleton,
  ProjectsPageSkeleton,
  ProjectDetailPageSkeleton,
  AgentsPageSkeleton,
} from '../components/skeletons';
import { ArtifactsPageSkeleton } from '../components/skeletons/ArtifactsPageSkeleton';

// Lazy load pages for code splitting
const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const SignInPage = lazy(() =>
  import('../pages/auth/SignInPage').then((m) => ({ default: m.SignInPage }))
);
const SignUpPage = lazy(() =>
  import('../pages/auth/SignUpPage').then((m) => ({ default: m.SignUpPage }))
);
const SSOCallbackPage = lazy(() =>
  import('../pages/auth/SSOCallbackPage').then((m) => ({
    default: m.SSOCallbackPage,
  }))
);
const NoProjectPage = lazy(() =>
  import('../pages/auth/NoProjectPage').then((m) => ({
    default: m.NoProjectPage,
  }))
);
// DashboardPage is not lazy-loaded since it handles its own loading state
import { DashboardPage } from '../pages/DashboardPage';
const SettingsPage = lazy(() =>
  import('../pages/admin/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  }))
);
const AnalyticsPage = lazy(() =>
  import('../pages/admin/AnalyticsPage').then((m) => ({
    default: m.AnalyticsPage,
  }))
);
const ArtifactsPage = lazy(() =>
  import('../pages/ArtifactsPage').then((m) => ({
    default: m.ArtifactsPage,
  }))
);
const ProjectsPage = lazy(() =>
  import('../pages/ProjectsPage').then((m) => ({
    default: m.ProjectsPage,
  }))
);
const ProjectDetailPage = lazy(() =>
  import('../pages/ProjectDetailPage').then((m) => ({
    default: m.ProjectDetailPage,
  }))
);
const AgentsPage = lazy(() =>
  import('../pages/AgentsPage').then((m) => ({
    default: m.AgentsPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({
    default: m.NotFoundPage,
  }))
);
const ErrorPage = lazy(() =>
  import('../pages/ErrorPage').then((m) => ({
    default: m.ErrorPage,
  }))
);

function ProvidersWrapper() {
  return (
    <ClerkProvider>
      <TRPCProvider>
        <SessionProvider>
          <Outlet />
        </SessionProvider>
      </TRPCProvider>
    </ClerkProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <ProvidersWrapper />,
    errorElement: (
      <Suspense fallback={null}>
        <ErrorPage />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: <RootLayout />,
        errorElement: (
          <Suspense fallback={null}>
            <ErrorPage />
          </Suspense>
        ),
        children: [
          // Public routes (landing + auth) with shared header
          {
            element: <PublicLayout />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LandingPageSkeleton />}>
                    <LandingPage />
                  </Suspense>
                ),
              },
              {
                path: 'sign-in/*',
                element: (
                  <Suspense fallback={<SignInPageSkeleton />}>
                    <SignInPage />
                  </Suspense>
                ),
              },
              {
                path: 'sign-up/*',
                element: (
                  <Suspense fallback={<SignUpPageSkeleton />}>
                    <SignUpPage />
                  </Suspense>
                ),
              },
              {
                path: 'sso-callback',
                element: (
                  <Suspense fallback={<SSOCallbackSkeleton />}>
                    <SSOCallbackPage />
                  </Suspense>
                ),
              },
            ],
          },
          // Protected routes under /app
          {
            path: 'app',
            element: <ProtectedLayout />,
            children: [
              {
                path: 'no-project',
                element: (
                  <Suspense fallback={<SignInPageSkeleton />}>
                    <NoProjectPage />
                  </Suspense>
                ),
              },
              {
                index: true,
                element: (
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                ),
              },
              {
                path: 'users',
                element: (
                  <AdminPageLayout>
                    <Suspense fallback={<SettingsPageSkeleton />}>
                      <SettingsPage />
                    </Suspense>
                  </AdminPageLayout>
                ),
              },
              {
                path: 'analytics',
                element: (
                  <AdminPageLayout>
                    <Suspense fallback={<AnalyticsPageSkeleton />}>
                      <AnalyticsPage />
                    </Suspense>
                  </AdminPageLayout>
                ),
              },
              {
                path: 'artifacts',
                element: (
                  <DashboardLayout showAgentPanel>
                    <Suspense fallback={<ArtifactsPageSkeleton />}>
                      <ArtifactsPage />
                    </Suspense>
                  </DashboardLayout>
                ),
              },
              {
                path: 'projects',
                element: (
                  <DashboardLayout showAgentPanel>
                    <Suspense fallback={<ProjectsPageSkeleton />}>
                      <ProjectsPage />
                    </Suspense>
                  </DashboardLayout>
                ),
              },
              {
                path: 'projects/:projectId',
                element: (
                  <DashboardLayout showAgentPanel>
                    <Suspense fallback={<ProjectDetailPageSkeleton />}>
                      <ProjectDetailPage />
                    </Suspense>
                  </DashboardLayout>
                ),
              },
              {
                path: 'agents',
                element: (
                  <DashboardLayout showAgentPanel>
                    <Suspense fallback={<AgentsPageSkeleton />}>
                      <AgentsPage />
                    </Suspense>
                  </DashboardLayout>
                ),
              },
            ],
          },
          // Catch-all 404 route
          {
            path: '*',
            element: (
              <Suspense fallback={null}>
                <NotFoundPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
