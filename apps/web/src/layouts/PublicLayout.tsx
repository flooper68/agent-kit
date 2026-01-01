import { useAuth } from '@clerk/clerk-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, Footer } from '../components/landing';
import { PublicLayoutSkeleton } from '../components/skeletons';

export function PublicLayout() {
  const { isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <PublicLayoutSkeleton />;
  }

  // No longer redirecting authenticated users - they can browse public pages
  // Header will show profile menu with "Go to Dashboard" link instead

  const isAuthPage =
    location.pathname.startsWith('/sign-in') ||
    location.pathname.startsWith('/sign-up') ||
    location.pathname === '/sso-callback';

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />

      {/* Background effects for auth pages */}
      {isAuthPage && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] animate-pulse rounded-full bg-info/10 blur-[100px] [animation-delay:1s]" />
          <div className="absolute right-1/4 top-2/3 h-[350px] w-[350px] animate-pulse rounded-full bg-primary/10 blur-[100px] [animation-delay:2s]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
