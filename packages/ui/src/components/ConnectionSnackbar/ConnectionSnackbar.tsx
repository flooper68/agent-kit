import { cn } from '../../lib/utils';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionSnackbarProps {
  /** The current connection status */
  status: ConnectionStatus;
  /** Number of reconnection attempts (shown when reconnecting) */
  reconnectAttempt?: number;
  /** Additional class names */
  className?: string;
}

const statusConfig: Record<ConnectionStatus, { dot: string; label: string }> = {
  connected: {
    dot: 'bg-green-500',
    label: 'Connected',
  },
  disconnected: {
    dot: 'bg-red-500',
    label: 'Disconnected',
  },
  reconnecting: {
    dot: 'bg-yellow-500',
    label: 'Reconnecting',
  },
};

export const ConnectionSnackbar = ({
  status,
  reconnectAttempt,
  className,
}: ConnectionSnackbarProps) => {
  const config = statusConfig[status];

  const label =
    status === 'reconnecting' && reconnectAttempt
      ? `${config.label}... (${reconnectAttempt})`
      : config.label;

  return (
    <div
      className={cn(
        'fixed top-16 right-4 z-50',
        'px-2 py-1 rounded-full',
        'text-xs text-muted-foreground',
        'bg-background/80 backdrop-blur-sm',
        'border border-border/50',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            config.dot,
            status !== 'disconnected' && 'animate-pulse'
          )}
        />
        <span>{label}</span>
      </div>
    </div>
  );
};

ConnectionSnackbar.displayName = 'ConnectionSnackbar';
