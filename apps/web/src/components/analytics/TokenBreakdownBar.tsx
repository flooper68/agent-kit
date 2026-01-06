import { useMemo } from 'react';
import { Text } from '@agent-kit/ui';

interface TokenBreakdown {
  systemPrompt: number;
  toolDefinitions: number;
  conversationHistory: number;
  toolResults: number;
  userInput: number;
  completion?: number;
}

interface TokenBreakdownBarProps {
  breakdown: TokenBreakdown;
}

const SEGMENT_COLORS = {
  systemPrompt: {
    bg: 'bg-blue-500',
    label: 'System',
  },
  toolDefinitions: {
    bg: 'bg-purple-500',
    label: 'Tools',
  },
  conversationHistory: {
    bg: 'bg-gray-400 dark:bg-gray-500',
    label: 'History',
  },
  toolResults: {
    bg: 'bg-amber-500',
    label: 'Results',
  },
  userInput: {
    bg: 'bg-green-500',
    label: 'Input',
  },
  completion: {
    bg: 'bg-orange-500',
    label: 'Response',
  },
};

function formatTokens(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function TokenBreakdownBar({ breakdown }: TokenBreakdownBarProps) {
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
      {
        key: 'systemPrompt' as const,
        value: breakdown.systemPrompt,
        percentage: (breakdown.systemPrompt / total) * 100,
      },
      {
        key: 'toolDefinitions' as const,
        value: breakdown.toolDefinitions,
        percentage: (breakdown.toolDefinitions / total) * 100,
      },
      {
        key: 'conversationHistory' as const,
        value: breakdown.conversationHistory,
        percentage: (breakdown.conversationHistory / total) * 100,
      },
      {
        key: 'toolResults' as const,
        value: breakdown.toolResults ?? 0,
        percentage: ((breakdown.toolResults ?? 0) / total) * 100,
      },
      {
        key: 'userInput' as const,
        value: breakdown.userInput,
        percentage: (breakdown.userInput / total) * 100,
      },
      {
        key: 'completion' as const,
        value: breakdown.completion ?? 0,
        percentage: ((breakdown.completion ?? 0) / total) * 100,
      },
    ].filter((s) => s.value > 0);
  }, [breakdown]);

  const total =
    breakdown.systemPrompt +
    breakdown.toolDefinitions +
    breakdown.conversationHistory +
    (breakdown.toolResults ?? 0) +
    breakdown.userInput +
    (breakdown.completion ?? 0);

  if (total === 0) {
    return (
      <Text className="text-sm text-muted-foreground">No breakdown data</Text>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`${SEGMENT_COLORS[segment.key].bg} transition-all`}
            style={{ width: `${segment.percentage}%` }}
            title={`${SEGMENT_COLORS[segment.key].label}: ${segment.value.toLocaleString()} tokens (${segment.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-sm ${SEGMENT_COLORS[segment.key].bg}`}
            />
            <Text className="text-xs text-muted-foreground">
              {SEGMENT_COLORS[segment.key].label}: {formatTokens(segment.value)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
