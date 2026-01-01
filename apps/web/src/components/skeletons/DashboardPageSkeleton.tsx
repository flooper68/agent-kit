import { Skeleton } from '@agent-kit/ui';

export function DashboardPageSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      {/* Title */}
      <Skeleton className="mb-2 h-9 w-48" />

      {/* Description */}
      <Skeleton className="mb-8 h-5 w-80" />

      {/* Input area */}
      <div className="w-full max-w-2xl space-y-4">
        {/* Agent selector */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
        </div>

        {/* Chat input */}
        <div className="rounded-lg border border-border bg-background p-3">
          {/* Textarea placeholder */}
          <Skeleton className="mb-3 h-12 w-full rounded-md" />
          {/* Input actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Model switcher */}
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
            {/* Send button */}
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>
  );
}
