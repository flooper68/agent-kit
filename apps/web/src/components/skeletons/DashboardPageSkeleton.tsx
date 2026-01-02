import { Skeleton } from '@agent-kit/ui';

function RecentChatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      {/* Title */}
      <Skeleton className="mb-1 h-5 w-3/4" />
      {/* Description */}
      <Skeleton className="mb-3 h-4 w-full" />
      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <Skeleton className="h-4 w-4 rounded-sm" />
          {/* User name */}
          <Skeleton className="h-3 w-16" />
          {/* Date */}
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Agent badge */}
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
      {/* Title */}
      <Skeleton className="mb-2 h-9 w-64" />

      {/* Input area */}
      <div className="mt-2 w-full max-w-2xl">
        {/* Chat input */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 shadow-md">
          {/* Textarea placeholder */}
          <Skeleton className="h-[66px] w-full rounded-md" />
          {/* Input actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Agent selector */}
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Recent chats */}
      <div className="mt-8 w-full max-w-3xl">
        <div className="grid grid-cols-2 gap-3">
          <RecentChatCardSkeleton />
          <RecentChatCardSkeleton />
        </div>
      </div>
    </div>
  );
}
