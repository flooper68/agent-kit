import { Skeleton } from '@agent-kit/ui';

export function AgentsPageSkeleton() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4"
            >
              {/* Icon and title */}
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              {/* Secret key placeholder */}
              <Skeleton className="mb-4 h-8 w-full rounded" />
              {/* Actions */}
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
