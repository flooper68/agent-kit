import { useAuth, useOrganization } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProtectedLayoutSkeleton } from '../components/skeletons';

export function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const location = useLocation();

  if (!isLoaded || !orgLoaded) {
    return <ProtectedLayoutSkeleton />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Allow access to no-project page without organization
  if (location.pathname === '/app/no-project') {
    return <Outlet />;
  }

  // Redirect to no-project page if no organization is active
  if (!organization) {
    return <Navigate to="/app/no-project" replace />;
  }

  // Layout wrapping is now handled by each route's element
  return <Outlet />;
}
