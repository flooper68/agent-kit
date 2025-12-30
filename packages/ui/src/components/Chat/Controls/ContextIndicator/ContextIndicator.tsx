import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import type { ContextUsage } from '../../../../types/chat';

export interface ContextIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  usage: ContextUsage;
  showBar?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export const ContextIndicator = forwardRef<
  HTMLDivElement,
  ContextIndicatorProps
>(
  (
    {
      usage,
      showBar = true,
      warningThreshold = 75,
      dangerThreshold = 90,
      className,
      ...props
    },
    ref
  ) => {
    const { used, total, percentage } = usage;

    const getColor = () => {
      if (percentage >= dangerThreshold) return 'text-destructive';
      if (percentage >= warningThreshold) return 'text-yellow-500';
      return 'text-muted-foreground';
    };

    const getBarColor = () => {
      if (percentage >= dangerThreshold) return 'bg-destructive';
      if (percentage >= warningThreshold) return 'bg-yellow-500';
      return 'bg-primary';
    };

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2 text-xs', getColor(), className)}
        {...props}
      >
        <span>
          {formatNumber(used)} / {formatNumber(total)} tokens
        </span>
        {showBar && (
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor())}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
        <span>({percentage.toFixed(0)}%)</span>
      </div>
    );
  }
);

ContextIndicator.displayName = 'ContextIndicator';
