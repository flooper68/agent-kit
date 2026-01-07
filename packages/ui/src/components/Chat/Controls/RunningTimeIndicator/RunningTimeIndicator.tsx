import { forwardRef } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { TaskStatus } from '../../../../types/chat';
import { Tooltip } from '../../../Tooltip';

export interface RunningTimeIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: TaskStatus;
  /** Formatted elapsed time label (e.g., "5s" or "1m 23s"). Pass null to hide. */
  elapsedLabel?: string | null;
}

export const RunningTimeIndicator = forwardRef<
  HTMLDivElement,
  RunningTimeIndicatorProps
>(({ status, elapsedLabel, className, ...props }, ref) => {
  const isStreaming = status === 'streaming';
  const isReady = status === 'ready';

  // Don't show if no label provided
  if (!elapsedLabel) {
    return null;
  }

  const Icon = isStreaming ? Clock : CheckCircle;
  const label = isStreaming
    ? `Running for ${elapsedLabel}`
    : `Worked for ${elapsedLabel}`;

  const tooltipContent = (
    <div className="text-xs">
      {isStreaming ? (
        <div>Agent is working...</div>
      ) : isReady ? (
        <div>Completed in {elapsedLabel}</div>
      ) : (
        <div>{elapsedLabel}</div>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} side="top">
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help',
          'tabular-nums border border-border rounded-md px-2 py-0.5',
          className
        )}
        {...props}
      >
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </span>
    </Tooltip>
  );
});

RunningTimeIndicator.displayName = 'RunningTimeIndicator';
