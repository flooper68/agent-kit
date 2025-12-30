import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

// Internal Skeleton component for building loading states
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);

// Tool skeleton for with-tools variant
const ToolSkeleton = () => (
  <div className="flex items-center gap-1.5">
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-6 w-24 rounded-full" />
  </div>
);

export interface MessageSkeletonProps {
  role?: 'user' | 'assistant';
  variant?: 'simple' | 'with-tools';
  toolCount?: number;
}

export const MessageSkeleton = forwardRef<HTMLDivElement, MessageSkeletonProps>(
  ({ role = 'assistant', variant = 'simple', toolCount = 2 }, ref) => {
    const isUser = role === 'user';

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 w-full',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 max-w-[85%]">
          {/* Tool skeletons for assistant with-tools variant */}
          {!isUser && variant === 'with-tools' && (
            <div className="space-y-1.5 mb-3">
              {Array.from({ length: toolCount }).map((_, i) => (
                <ToolSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Text content skeletons */}
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          {!isUser && <Skeleton className="h-4 w-5/6" />}
        </div>
      </div>
    );
  }
);

MessageSkeleton.displayName = 'MessageSkeleton';

export interface LoadingStateProps {
  count?: number;
  variant?: 'simple' | 'with-tools';
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ count = 3, variant = 'simple' }, ref) => {
    return (
      <div ref={ref} className="space-y-4 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <MessageSkeleton
            key={i}
            role={i % 2 === 0 ? 'user' : 'assistant'}
            variant={i % 2 === 1 ? variant : 'simple'}
          />
        ))}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
