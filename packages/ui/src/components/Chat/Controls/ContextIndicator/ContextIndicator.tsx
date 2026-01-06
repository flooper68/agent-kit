import { forwardRef, useMemo } from 'react';
import { cn } from '../../../../lib/utils';
import type { ContextUsage, TokenBreakdown } from '../../../../types/chat';
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

const BREAKDOWN_COLORS = {
  systemPrompt: 'bg-blue-500',
  toolDefinitions: 'bg-purple-500',
  conversationHistory: 'bg-gray-400',
  toolResults: 'bg-amber-500',
  userInput: 'bg-green-500',
  completion: 'bg-orange-500',
};

const BREAKDOWN_LABELS = {
  systemPrompt: 'System',
  toolDefinitions: 'Tools',
  conversationHistory: 'History',
  toolResults: 'Results',
  userInput: 'Input',
  completion: 'Response',
};

function TokenBreakdownTooltip({ breakdown }: { breakdown: TokenBreakdown }) {
  const segments = useMemo(() => {
    const total =
      breakdown.systemPrompt +
      breakdown.toolDefinitions +
      breakdown.conversationHistory +
      (breakdown.toolResults ?? 0) +
      breakdown.userInput +
      (breakdown.completion ?? 0);

    if (total === 0) return [];

    return [
      { key: 'systemPrompt' as const, value: breakdown.systemPrompt },
      { key: 'toolDefinitions' as const, value: breakdown.toolDefinitions },
      {
        key: 'conversationHistory' as const,
        value: breakdown.conversationHistory,
      },
      { key: 'toolResults' as const, value: breakdown.toolResults ?? 0 },
      { key: 'userInput' as const, value: breakdown.userInput },
      { key: 'completion' as const, value: breakdown.completion ?? 0 },
    ]
      .filter((s) => s.value > 0)
      .map((s) => ({
        ...s,
        percentage: (s.value / total) * 100,
      }));
  }, [breakdown]);

  if (segments.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
      <div className="opacity-80">Context breakdown:</div>
      {/* Stacked bar */}
      <div className="flex h-2 w-full overflow-hidden rounded bg-muted">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={BREAKDOWN_COLORS[segment.key]}
            style={{ width: `${segment.percentage}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1">
            <div
              className={cn(
                'h-2 w-2 rounded-sm',
                BREAKDOWN_COLORS[segment.key]
              )}
            />
            <span className="opacity-80">
              {BREAKDOWN_LABELS[segment.key]}: {formatNumber(segment.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {usage.tokenBreakdown && (
          <TokenBreakdownTooltip breakdown={usage.tokenBreakdown} />
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
