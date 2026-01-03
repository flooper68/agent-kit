import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

// Internal Skeleton component for building loading states
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);

export interface MessageSkeletonProps {
  role?: 'user' | 'assistant';
}

/**
 * MessageSkeleton matches the Message component layout:
 * - Column layout with proper alignment (user=right, assistant=left)
 * - User messages show small avatar above bubble
 * - Assistant messages show text lines
 */
export const MessageSkeleton = forwardRef<HTMLDivElement, MessageSkeletonProps>(
  ({ role = 'assistant' }, ref) => {
    const isUser = role === 'user';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1 w-full min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* User avatar skeleton */}
        {isUser && <Skeleton className="h-6 w-6 rounded-full" />}

        {/* Message bubble skeleton */}
        <div
          className={cn(
            'space-y-2',
            isUser
              ? 'bg-muted rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]'
              : 'w-full'
          )}
        >
          {isUser ? (
            // User message: short text in bubble
            <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
          ) : (
            // Assistant message: multiple lines of text
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </>
          )}
        </div>
      </div>
    );
  }
);

MessageSkeleton.displayName = 'MessageSkeleton';

export interface LoadingStateProps {
  count?: number;
}

/**
 * LoadingState renders skeleton messages that match the MessageList layout.
 * Uses the same container styling as MessageList for proper alignment.
 */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ count = 3 }, ref) => {
    return (
      <div ref={ref} className="flex-1 min-h-0 overflow-y-auto py-6">
        <div className="max-w-3xl mx-auto px-4 space-y-6 min-w-0">
          {Array.from({ length: count }).map((_, i) => (
            <MessageSkeleton
              key={i}
              role={i % 2 === 0 ? 'user' : 'assistant'}
            />
          ))}
        </div>
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
