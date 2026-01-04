import { Skeleton } from '@agent-kit/ui';

export function ProjectDetailPageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="mb-4 h-4 w-96" />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/30 border-t-2 border-t-muted"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="flex-1 p-2 space-y-2">
                  {[...Array(i === 0 ? 3 : i === 1 ? 2 : 1)].map((_, j) => (
                    <div
                      key={j}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <Skeleton className="mb-2 h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
