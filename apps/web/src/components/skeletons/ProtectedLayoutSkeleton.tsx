import { Skeleton } from '@agent-kit/ui';
import { DashboardPageSkeleton } from './DashboardPageSkeleton';

export function ProtectedLayoutSkeleton() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] bg-background">
      {/* Header skeleton - matches AppLayout Header */}
      <header className="flex h-12 items-center border-b border-border bg-background">
        {/* Left Zone */}
        <div className="flex h-full items-center gap-1 px-2">
          {/* Main menu button */}
          <Skeleton className="h-8 w-24 rounded-md" />
          {/* Divider */}
          <span className="text-lg text-muted-foreground/50">/</span>
          {/* Project switcher */}
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2 px-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Main content - full dashboard skeleton */}
      <main className="flex-1 overflow-auto">
        <DashboardPageSkeleton />
      </main>
    </div>
  );
}
