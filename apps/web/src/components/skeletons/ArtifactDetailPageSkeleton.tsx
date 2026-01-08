import { Skeleton } from '@agent-kit/ui';

export function ArtifactDetailPageSkeleton() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Metadata */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-10 w-20 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
        </div>

        {/* Content */}
        <div className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
