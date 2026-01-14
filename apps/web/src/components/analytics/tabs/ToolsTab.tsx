import { trpc } from '../../../lib/trpc';
import {
  SessionLengthChart,
  ToolTypeDistributionChart,
  ToolCallsPerSessionCard,
  ToolCallErrorsChart,
  ChartErrorBoundary,
} from '..';
import type { TimeRange } from '..';

interface ToolsTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function ToolsTab({ timeRange, userId }: ToolsTabProps) {
  const sessionLengthQuery =
    trpc.analytics.getSessionLengthDistribution.useQuery({
      timeRange,
      userId,
    });

  const toolCallsPerSessionQuery =
    trpc.analytics.getToolCallsPerSession.useQuery({
      timeRange,
      userId,
    });

  const toolTypeDistributionQuery =
    trpc.analytics.getToolTypeDistribution.useQuery({
      timeRange,
      userId,
    });

  const toolCallErrorsQuery = trpc.analytics.getToolCallErrors.useQuery({
    timeRange,
    userId,
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Messages per Session">
          <SessionLengthChart
            data={sessionLengthQuery.data ?? []}
            isLoading={sessionLengthQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Tool Type Distribution">
          <ToolTypeDistributionChart
            data={toolTypeDistributionQuery.data ?? []}
            isLoading={toolTypeDistributionQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tool Calls per Session">
          <ToolCallsPerSessionCard
            data={toolCallsPerSessionQuery.data}
            isLoading={toolCallsPerSessionQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Tool Call Errors">
          <ToolCallErrorsChart
            data={toolCallErrorsQuery.data}
            isLoading={toolCallErrorsQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
