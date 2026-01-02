import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ClerkProvider } from '../providers/ClerkProvider';
import { TRPCProvider } from '../providers/TRPCProvider';
import { SessionProvider } from '../contexts/SessionContext';
import { RootLayout } from '../layouts/RootLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProtectedLayout } from '../layouts/ProtectedLayout';
import {
  LandingPageSkeleton,
  SignInPageSkeleton,
  SignUpPageSkeleton,
  SSOCallbackSkeleton,
  DashboardPageSkeleton,
} from '../components/skeletons';

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
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
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
    children: [
      {
        path: '/',
        element: <RootLayout />,
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
                  <Suspense fallback={<DashboardPageSkeleton />}>
                    <DashboardPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
