import { memo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export type SubAgentSessionStatus = 'active' | 'complete' | 'error';

export interface SubAgentDialogFooterProps {
  /** Current status of the session */
  status: SubAgentSessionStatus;
  /** Whether the session is actively streaming */
  isStreaming: boolean;
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  /** Estimated cost in dollars */
  estimatedCost?: number;
}

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      status: {
        active: 'bg-info/10 text-info',
        complete: 'bg-success/10 text-success',
        error: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  }
);

// Status icons
const StatusIcon = ({ status }: { status: SubAgentSessionStatus }) => {
  switch (status) {
    case 'active':
      return (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case 'complete':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'error':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
  }
};

/**
 * Format token count (e.g., 2341 -> "2.3k")
 */
function formatTokens(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Format cost (e.g., 0.02 -> "$0.02")
 */
function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Get status label
 */
function getStatusLabel(
  status: SubAgentSessionStatus,
  isStreaming: boolean
): string {
  if (isStreaming) return 'Streaming';
  switch (status) {
    case 'active':
      return 'Active';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
  }
}

/**
 * Custom comparison function for memoization
 */
function areSubAgentDialogFooterPropsEqual(
  prev: SubAgentDialogFooterProps,
  next: SubAgentDialogFooterProps
): boolean {
  if (prev.status !== next.status) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.estimatedCost !== next.estimatedCost) return false;
  if (prev.usage?.promptTokens !== next.usage?.promptTokens) return false;
  if (prev.usage?.completionTokens !== next.usage?.completionTokens)
    return false;
  return true;
}

export const SubAgentDialogFooter = memo(function SubAgentDialogFooter({
  status,
  isStreaming,
  usage,
  estimatedCost,
}: SubAgentDialogFooterProps) {
  const totalTokens = usage
    ? usage.promptTokens + usage.completionTokens
    : undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'pt-4 border-t border-border',
        'text-sm text-muted-foreground'
      )}
    >
      {/* Status badge */}
      <span className={cn(statusBadgeVariants({ status }))}>
        <StatusIcon status={status} />
        {getStatusLabel(status, isStreaming)}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {totalTokens !== undefined && (
          <span>Tokens: {formatTokens(totalTokens)}</span>
        )}
        {estimatedCost !== undefined && (
          <span>Cost: {formatCost(estimatedCost)}</span>
        )}
      </div>
    </div>
  );
}, areSubAgentDialogFooterPropsEqual);
