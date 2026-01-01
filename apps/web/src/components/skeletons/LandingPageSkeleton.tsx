import { Skeleton } from '@agent-kit/ui';

export function LandingPageSkeleton() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        {/* Headline */}
        <Skeleton className="mx-auto mb-6 h-16 w-3/4 sm:h-20" />

        {/* Subheading */}
        <div className="mx-auto mb-8 max-w-2xl space-y-2">
          <Skeleton className="mx-auto h-5 w-full" />
          <Skeleton className="mx-auto h-5 w-4/5" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Skeleton className="h-12 w-[200px] rounded-md" />
          <Skeleton className="h-12 w-[200px] rounded-md" />
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-8 w-8 rounded-full border-2 border-background"
              />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </section>
  );
}
