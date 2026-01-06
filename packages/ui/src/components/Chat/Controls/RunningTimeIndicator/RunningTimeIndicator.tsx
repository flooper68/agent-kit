import { forwardRef, useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { TaskStatus } from '../../../../types/chat';
import { Tooltip } from '../../../Tooltip';

export interface RunningTimeIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: TaskStatus;
  streamingStartTime?: number | null;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const RunningTimeIndicator = forwardRef<
  HTMLDivElement,
  RunningTimeIndicatorProps
>(({ status, streamingStartTime, className, ...props }, ref) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (status === 'streaming' && streamingStartTime) {
      wasStreamingRef.current = true;
      setFinalDuration(null);

      // Calculate initial elapsed time
      const initialElapsed = Math.floor(
        (Date.now() - streamingStartTime) / 1000
      );
      setElapsedSeconds(initialElapsed);

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - streamingStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else if (
      wasStreamingRef.current &&
      status === 'ready' &&
      elapsedSeconds > 0
    ) {
      // Lock the final duration when streaming ends
      setFinalDuration(elapsedSeconds);
      wasStreamingRef.current = false;
    }
  }, [status, streamingStartTime, elapsedSeconds]);

  // Reset when a new streaming session starts (streamingStartTime changes)
  useEffect(() => {
    if (streamingStartTime && status !== 'streaming') {
      // Reset for next session
      setElapsedSeconds(0);
    }
  }, [streamingStartTime, status]);

  const isStreaming = status === 'streaming' && streamingStartTime;
  const showCompleted = finalDuration !== null && status === 'ready';

  if (!isStreaming && !showCompleted) {
    return null;
  }

  const displayDuration = isStreaming ? elapsedSeconds : (finalDuration ?? 0);
  const Icon = isStreaming ? Clock : CheckCircle;
  const label = isStreaming
    ? `Running for ${formatDuration(displayDuration)}`
    : `Worked for ${formatDuration(displayDuration)}`;

  const tooltipContent = (
    <div className="text-xs">
      {isStreaming ? (
        <div>Agent is working...</div>
      ) : (
        <div>Completed in {formatDuration(displayDuration)}</div>
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
