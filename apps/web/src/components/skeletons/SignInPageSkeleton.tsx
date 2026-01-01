import { Skeleton } from '@agent-kit/ui';

export function SignInPageSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        {/* Title */}
        <Skeleton className="mx-auto mb-6 h-7 w-48" />

        {/* Form fields */}
        <div className="space-y-4">
          {/* Email field */}
          <div>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Password field */}
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Submit button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-px flex-1" />
        </div>

        {/* OAuth button */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
