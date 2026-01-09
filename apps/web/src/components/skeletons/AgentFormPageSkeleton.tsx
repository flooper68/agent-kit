import { Skeleton } from '@agent-kit/ui';

export function AgentFormPageSkeleton() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header with back button and title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-4 w-80 ml-11" />
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-border bg-card p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
          </div>

          {/* Form fields */}
          <div className="space-y-6">
            {/* Identity section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded" />
              </div>
            </div>

            {/* Model section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-16" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              </div>
            </div>

            {/* System prompt section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40 w-full rounded" />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
