import { useOrganization, useClerk } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Button, FormCard, Text, Skeleton } from '@agent-kit/ui';
import { LogOut } from 'lucide-react';

function NoProjectSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mb-6 flex justify-center">
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

export function NoProjectPage() {
  const { organization, isLoaded } = useOrganization();
  const { signOut } = useClerk();

  // If user has an active organization, redirect to dashboard
  if (organization && isLoaded) {
    return <Navigate to="/" replace />;
  }

  if (!isLoaded) {
    return <NoProjectSkeleton />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <FormCard
        title="No Project Assigned"
        description="You are not assigned to any project yet."
        className="max-w-md text-center"
      >
        <Text color="muted" className="mb-6">
          Please contact your administrator to be assigned to a project.
        </Text>

        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </FormCard>
    </div>
  );
}
