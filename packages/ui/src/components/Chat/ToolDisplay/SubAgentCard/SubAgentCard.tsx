import { Component, forwardRef, memo, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../Button';

// Error Boundary for graceful error handling
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SubAgentCardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Failed to render sub-agent card</span>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

type SubAgentStatus = 'pending' | 'running' | 'complete' | 'error';

const subAgentCardVariants = cva(['rounded-lg border p-3 transition-colors'], {
  variants: {
    status: {
      pending: 'bg-muted/50 border-muted-foreground/20',
      running: 'bg-info/5 border-info/20',
      complete: 'bg-success/5 border-success/20',
      error: 'bg-destructive/5 border-destructive/20',
    },
  },
  defaultVariants: {
    status: 'pending',
  },
});

const statusBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
  ],
  {
    variants: {
      status: {
        pending: 'bg-muted text-muted-foreground',
        running: 'bg-info/10 text-info',
        complete: 'bg-success/10 text-success',
        error: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

// Status icons as inline SVGs
const StatusIcon = ({ status }: { status: SubAgentStatus }) => {
  switch (status) {
    case 'pending':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      );
    case 'running':
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

// Agent icon
const AgentIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.5 4.5h-11L5 14.5m14 0l-3-3m-7.5 3l3-3"
    />
  </svg>
);

// Expand icon for "Open Full View" button
const ExpandIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
    />
  </svg>
);

export interface SubAgentCardProps
  extends Omit<VariantProps<typeof subAgentCardVariants>, 'status'> {
  /** Name of the sub-agent */
  agentName: string;
  /** Session ID - available after tool result */
  sessionId?: string;
  /** Current status of the sub-agent */
  status: SubAgentStatus;
  /** 1-2 line summary when complete */
  summary?: string;
  /** Current action while running */
  latestAction?: string;
  /** Error message when status is error */
  errorMessage?: string;
  /** Callback to open full view dialog */
  onOpenFullView?: () => void;
  /** Callback to retry after error */
  onRetry?: () => void;
}

/**
 * Custom comparison function for SubAgentCard memoization
 */
function areSubAgentCardPropsEqual(
  prev: SubAgentCardProps,
  next: SubAgentCardProps
): boolean {
  if (prev.agentName !== next.agentName) return false;
  if (prev.sessionId !== next.sessionId) return false;
  if (prev.status !== next.status) return false;
  if (prev.summary !== next.summary) return false;
  if (prev.latestAction !== next.latestAction) return false;
  if (prev.errorMessage !== next.errorMessage) return false;
  if (prev.onOpenFullView !== next.onOpenFullView) return false;
  if (prev.onRetry !== next.onRetry) return false;
  return true;
}

const SubAgentCardInner = memo(
  forwardRef<HTMLDivElement, SubAgentCardProps>(
    (
      {
        agentName,
        sessionId: _sessionId,
        status,
        summary,
        latestAction,
        errorMessage,
        onOpenFullView,
        onRetry,
      },
      ref
    ) => {
      // Determine what content to show based on status
      const getStatusContent = () => {
        switch (status) {
          case 'pending':
            return 'Starting agent...';
          case 'running':
            return latestAction ?? 'Processing...';
          case 'complete':
            return summary ?? 'Task completed';
          case 'error':
            return errorMessage ?? 'An error occurred';
        }
      };

      const getStatusLabel = () => {
        switch (status) {
          case 'pending':
            return 'Pending';
          case 'running':
            return 'Running';
          case 'complete':
            return 'Complete';
          case 'error':
            return 'Error';
        }
      };

      return (
        <div ref={ref} className={cn(subAgentCardVariants({ status }))}>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AgentIcon />
              <span>spawn_agent: {agentName}</span>
            </div>
            <span className={cn(statusBadgeVariants({ status }))}>
              <StatusIcon status={status} />
              {getStatusLabel()}
            </span>
          </div>

          {/* Content area */}
          <div className="rounded-md bg-background/50 p-2.5">
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {getStatusContent()}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 mt-2 min-h-[32px]">
              {status === 'error' && onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
              {onOpenFullView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenFullView}
                  className="text-xs gap-1"
                >
                  <ExpandIcon />
                  Open Full View
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
  ),
  areSubAgentCardPropsEqual
);

SubAgentCardInner.displayName = 'SubAgentCardInner';

/**
 * SubAgentCard wrapped with error boundary for graceful error handling.
 * Prevents malformed data from crashing the entire chat UI.
 */
export const SubAgentCard = forwardRef<HTMLDivElement, SubAgentCardProps>(
  (props, ref) => (
    <SubAgentCardErrorBoundary>
      <SubAgentCardInner {...props} ref={ref} />
    </SubAgentCardErrorBoundary>
  )
);

SubAgentCard.displayName = 'SubAgentCard';
