import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Clock, RefreshCw, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const syncStatusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        pending:
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        syncing:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        synced:
          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        failed:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'error';

export interface SyncStatusBadgeProps
  extends VariantProps<typeof syncStatusBadgeVariants> {
  status: SyncStatus;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const statusLabels: Record<SyncStatus, string> = {
  pending: 'Pending',
  syncing: 'Syncing',
  synced: 'Synced',
  failed: 'Failed',
  error: 'Error',
};

const StatusIcon = ({
  status,
  className,
}: {
  status: SyncStatus;
  className?: string;
}) => {
  switch (status) {
    case 'pending':
      return <Clock className={cn('h-3 w-3', className)} />;
    case 'syncing':
      return <RefreshCw className={cn('h-3 w-3 animate-spin', className)} />;
    case 'synced':
      return <Check className={cn('h-3 w-3', className)} />;
    case 'failed':
      return <AlertTriangle className={cn('h-3 w-3', className)} />;
    case 'error':
      return <XCircle className={cn('h-3 w-3', className)} />;
  }
};

export function SyncStatusBadge({
  status,
  showIcon = true,
  showLabel = true,
  className,
}: SyncStatusBadgeProps) {
  return (
    <span className={cn(syncStatusBadgeVariants({ status }), className)}>
      {showIcon && <StatusIcon status={status} />}
      {showLabel && statusLabels[status]}
    </span>
  );
}

SyncStatusBadge.displayName = 'SyncStatusBadge';
