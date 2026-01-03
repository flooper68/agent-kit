import { Skeleton } from '../../../Skeleton';

export function AgentSelectorSkeleton() {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-md"
      aria-hidden="true"
    >
      {/* Agent name placeholder */}
      <Skeleton className="h-4 w-24" />
      {/* Chevron icon placeholder */}
      <Skeleton className="h-4 w-4" />
    </div>
  );
}

AgentSelectorSkeleton.displayName = 'AgentSelectorSkeleton';
