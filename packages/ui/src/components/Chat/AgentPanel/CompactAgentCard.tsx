import { memo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { Button } from '../../Button';
import type { TaskMessage } from '../../../types/chat';
import type { CompactStatus } from './types';
import { CompactMessageView } from './CompactMessageView';

// Card container variants based on status
const compactCardVariants = cva(['rounded-md border p-2 transition-colors'], {
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

// Status badge variants
const statusBadgeVariants = cva(
  [
    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium',
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
const StatusIcon = ({ status }: { status: CompactStatus }) => {
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

// Bot icon (Lucide bot icon)
const BotIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

// External link icon for "Open Full View" button
const ExternalLinkIcon = () => (
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
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

export interface CompactAgentCardProps {
  /** Name of the agent */
  agentName: string;
  /** Current status */
  status: CompactStatus;
  /** Messages to display */
  messages: TaskMessage[];
  /** Formatted elapsed time label (e.g., "5s" or "1m 23s"). Pass null to hide. */
  elapsedLabel?: string | null;
  /** Callback when "Open Full View" is clicked */
  onOpenFullView?: () => void;
  /** Callback for retry on error */
  onRetry?: () => void;
  /** Callback when a nested sub-agent dialog should open */
  onOpenSubAgentDialog?: (sessionId: string) => void;
}

const getStatusLabel = (status: CompactStatus): string => {
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

/**
 * CompactAgentCard wraps the compact message view with card chrome
 * including header, status badge, and action buttons.
 */
export const CompactAgentCard = memo(function CompactAgentCard({
  agentName,
  status,
  messages,
  elapsedLabel,
  onOpenFullView,
  onRetry,
  onOpenSubAgentDialog,
}: CompactAgentCardProps) {
  const isStreaming = status === 'pending' || status === 'running';

  return (
    <div className={cn(compactCardVariants({ status }))}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <BotIcon />
          <span>Agent: {agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(statusBadgeVariants({ status }))}>
            <StatusIcon status={status} />
            {getStatusLabel(status)}
          </span>
          {elapsedLabel && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {elapsedLabel}
            </span>
          )}
          {status === 'error' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-5 px-1.5 text-xs"
            >
              Retry
            </Button>
          )}
          {onOpenFullView && (
            <button
              onClick={onOpenFullView}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Open full view"
            >
              <ExternalLinkIcon />
            </button>
          )}
        </div>
      </div>

      {/* Content area - only show during streaming */}
      {isStreaming && (
        <div className="rounded bg-background/50 p-2 mt-2">
          <div className="h-9 overflow-hidden flex flex-col justify-end">
            <CompactMessageView
              messages={messages}
              onOpenSubAgentDialog={onOpenSubAgentDialog}
            />
          </div>
        </div>
      )}
    </div>
  );
});

CompactAgentCard.displayName = 'CompactAgentCard';
