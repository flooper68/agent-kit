import { cn } from '../../lib/utils';

export interface StreamingIndicatorProps {
  /** Additional class names */
  className?: string;
  /** Size of the indicator dot */
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
};

/**
 * Animated pulsing dot indicator for showing active streaming/generation status.
 * Uses a ping animation effect to draw attention to actively streaming sessions.
 */
export function StreamingIndicator({
  className,
  size = 'sm',
}: StreamingIndicatorProps) {
  return (
    <span
      className={cn('relative inline-flex', sizeClasses[size], className)}
      aria-label="Streaming in progress"
    >
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75'
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full bg-primary',
          sizeClasses[size]
        )}
      />
    </span>
  );
}

StreamingIndicator.displayName = 'StreamingIndicator';
