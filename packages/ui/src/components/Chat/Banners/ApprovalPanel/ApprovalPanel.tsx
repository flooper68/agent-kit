import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../Button';
import { Tooltip } from '../../../Tooltip';

export interface ApprovalPanelProps {
  /** Title/message displayed in the panel */
  title?: string;
  /** Full command details to display in a scrollable box */
  commandDetails?: string;
  /** Callback when approve button is clicked */
  onApprove: () => void;
  /** Callback when deny button is clicked */
  onDeny: () => void;
  /** Custom label for approve button */
  approveLabel?: string;
  /** Custom label for deny button */
  denyLabel?: string;
  /** Whether the approve action is loading */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

// Clipboard/plan icon (constant JSX to avoid recreation)
const PlanIcon = (
  <svg
    className="h-5 w-5 flex-shrink-0 text-info"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

export const ApprovalPanel = forwardRef<HTMLDivElement, ApprovalPanelProps>(
  (
    {
      title = "Here's my plan:",
      commandDetails,
      onApprove,
      onDeny,
      approveLabel = 'Approve',
      denyLabel = 'Reject',
      isLoading = false,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Approval panel"
        className={cn(
          'flex flex-col gap-2 p-3 rounded-lg',
          'bg-info/10 border border-info/20',
          'text-sm animate-slide-down',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {PlanIcon}
          <p className="flex-1 font-medium text-foreground">{title}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDeny}
              disabled={isLoading}
            >
              {denyLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              isLoading={isLoading}
            >
              {approveLabel}
            </Button>
          </div>
        </div>
        {commandDetails && (
          <Tooltip
            content={
              <pre className="max-w-md whitespace-pre-wrap break-words text-xs font-mono">
                {commandDetails}
              </pre>
            }
            side="bottom"
          >
            <code className="block truncate rounded bg-muted/50 px-2 py-1 text-xs font-mono text-muted-foreground cursor-help">
              {commandDetails}
            </code>
          </Tooltip>
        )}
      </div>
    );
  }
);

ApprovalPanel.displayName = 'ApprovalPanel';
