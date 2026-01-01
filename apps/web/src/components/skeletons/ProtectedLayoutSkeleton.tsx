import { Skeleton } from '@agent-kit/ui';

function ChatEmptyStateSkeleton() {
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

      {/* Main content - full chat empty state */}
      <main className="flex-1 overflow-auto">
        <ChatEmptyStateSkeleton />
      </main>
    </div>
  );
}
