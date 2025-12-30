import { cn } from '../../lib/utils';

export type StatusType = 'connected' | 'disconnected' | 'loading' | 'error';

export interface StatusIndicatorProps {
  /** The status to display */
  status: StatusType;
  /** Optional label text */
  label?: string;
  /** Whether to animate the indicator */
  animate?: boolean;
  /** Size of the indicator dot */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-gray-400',
  loading: 'bg-yellow-500',
  error: 'bg-red-500',
};

const sizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

export const StatusIndicator = ({
  status,
  label,
  animate = true,
  size = 'md',
  className,
}: StatusIndicatorProps) => {
  const shouldAnimate =
    animate && (status === 'connected' || status === 'loading');

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          statusColors[status],
          shouldAnimate && 'animate-pulse'
        )}
      />
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
};

StatusIndicator.displayName = 'StatusIndicator';
