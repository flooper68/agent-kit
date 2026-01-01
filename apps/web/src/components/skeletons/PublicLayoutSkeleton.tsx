import { Skeleton } from '@agent-kit/ui';

export function PublicLayoutSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header skeleton */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-20" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </header>

      {/* Content area */}
      <main className="relative z-10 flex flex-1 flex-col pt-16">
        {/* Centered content placeholder */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Skeleton className="mx-auto mb-4 h-8 w-48" />
            <Skeleton className="mx-auto mb-2 h-4 w-64" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </footer>
    </div>
  );
}
