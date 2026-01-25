import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const integrationCardVariants = cva(
  'rounded-lg border bg-card p-4 transition-colors',
  {
    variants: {
      status: {
        disconnected: 'border-border',
        connected: 'border-green-200 dark:border-green-900',
        error: 'border-red-200 dark:border-red-900',
      },
    },
    defaultVariants: {
      status: 'disconnected',
    },
  }
);

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        disconnected:
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        connected:
          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      },
    },
    defaultVariants: {
      status: 'disconnected',
    },
  }
);

export type IntegrationStatus = 'disconnected' | 'connected' | 'error';

export interface IntegrationCardProps
  extends VariantProps<typeof integrationCardVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status: IntegrationStatus;
  statusLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

const StatusIcon = ({ status }: { status: IntegrationStatus }) => {
  switch (status) {
    case 'connected':
      return <Check className="h-3 w-3" />;
    case 'error':
      return <AlertCircle className="h-3 w-3" />;
    case 'disconnected':
    default:
      return <X className="h-3 w-3" />;
  }
};

const statusLabels: Record<IntegrationStatus, string> = {
  disconnected: 'Disconnected',
  connected: 'Connected',
  error: 'Error',
};

export const IntegrationCard = forwardRef<HTMLDivElement, IntegrationCardProps>(
  (
    { title, description, icon, status, statusLabel, children, className },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(integrationCardVariants({ status }), className)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <span className={cn(statusBadgeVariants({ status }))}>
            <StatusIcon status={status} />
            {statusLabel ?? statusLabels[status]}
          </span>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  }
);

IntegrationCard.displayName = 'IntegrationCard';
