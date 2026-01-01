import { Skeleton } from '@agent-kit/ui';

function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full" />
      {/* Name and email */}
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-1 h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      {/* Role badge */}
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function MembersSectionSkeleton() {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      <MemberRowSkeleton />
      <MemberRowSkeleton />
      <MemberRowSkeleton />
    </div>
  );
}
