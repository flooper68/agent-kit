import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import type { ContextUsage } from '../../../../types/chat';

export interface ContextIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  usage: ContextUsage;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export const ContextIndicator = forwardRef<
  HTMLDivElement,
  ContextIndicatorProps
>(
  (
    { usage, warningThreshold = 75, dangerThreshold = 90, className, ...props },
    ref
  ) => {
    const { used, total, percentage } = usage;

    const getColor = () => {
      if (percentage >= dangerThreshold) return 'text-destructive';
      if (percentage >= warningThreshold) return 'text-warning';
      return 'text-muted-foreground';
    };

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    return (
      <span
        ref={ref}
        className={cn('text-xs', getColor(), className)}
        title={`${formatNumber(used)} / ${formatNumber(total)} tokens used`}
        {...props}
      >
        {formatNumber(used)}/{formatNumber(total)} ({percentage.toFixed(0)}%)
      </span>
    );
  }
);

ContextIndicator.displayName = 'ContextIndicator';
