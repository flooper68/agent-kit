import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import type { ContextUsage } from '../../../../types/chat';
import { Tooltip } from '../../../Tooltip';

export interface ContextIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  usage: ContextUsage;
  warningThreshold?: number;
  dangerThreshold?: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCost = (cost: number) => {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
};

export const ContextIndicator = forwardRef<
  HTMLDivElement,
  ContextIndicatorProps
>(
  (
    { usage, warningThreshold = 75, dangerThreshold = 90, className, ...props },
    ref
  ) => {
    const {
      used,
      total,
      percentage,
      promptTokens,
      completionTokens,
      estimatedCost,
    } = usage;

    const getColor = () => {
      if (percentage >= dangerThreshold) return 'text-destructive';
      if (percentage >= warningThreshold) return 'text-warning';
      return 'text-muted-foreground';
    };

    const tooltipContent = (
      <div className="space-y-1 text-xs">
        <div>
          {formatNumber(used)} / {formatNumber(total)} tokens
        </div>
        {promptTokens !== undefined && completionTokens !== undefined && (
          <div className="opacity-80">
            In: {formatNumber(promptTokens)} | Out:{' '}
            {formatNumber(completionTokens)}
          </div>
        )}
        {estimatedCost !== undefined && estimatedCost > 0 && (
          <div className="font-medium">Cost: {formatCost(estimatedCost)}</div>
        )}
      </div>
    );

    return (
      <Tooltip content={tooltipContent} side="top">
        <span
          ref={ref}
          className={cn('text-xs cursor-help', getColor(), className)}
          {...props}
        >
          {formatNumber(used)}/{formatNumber(total)} ({percentage.toFixed(0)}%)
        </span>
      </Tooltip>
    );
  }
);

ContextIndicator.displayName = 'ContextIndicator';
