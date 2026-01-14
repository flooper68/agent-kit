import { MessageSquare, Users, DollarSign, Coins } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import {
  StatCard,
  UsageChart,
  CostBreakdownChart,
  ChartErrorBoundary,
  SessionLengthChart,
  ToolTypeDistributionChart,
  ToolCallsPerSessionCard,
  ToolCallErrorsChart,
} from '..';
import type { TimeRange } from '..';

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

interface OverviewTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function OverviewTab({ timeRange, userId }: OverviewTabProps) {
  const overviewQuery = trpc.analytics.getOverview.useQuery({
    timeRange,
    userId,
  });

  const usageQuery = trpc.analytics.getUsageOverTime.useQuery({
    timeRange,
    userId,
  });

  const providerDistQuery = trpc.analytics.getProviderDistribution.useQuery({
    timeRange,
    userId,
  });

  // Tool call analytics
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

  const overview = overviewQuery.data;
  const isLoadingOverview = overviewQuery.isLoading;

  const stats = [
    {
      label: 'Total Sessions',
      value: isLoadingOverview
        ? '-'
        : formatNumber(overview?.totalSessions ?? 0),
      trend: overview?.trends.sessions,
      icon: MessageSquare,
    },
    {
      label: 'Active Users',
      value: isLoadingOverview ? '-' : formatNumber(overview?.activeUsers ?? 0),
      trend: overview?.trends.users,
      icon: Users,
    },
    {
      label: 'Total Cost',
      value: isLoadingOverview ? '-' : formatCurrency(overview?.totalCost ?? 0),
      trend: overview?.trends.cost,
      icon: DollarSign,
    },
    {
      label: 'Total Tokens',
      value: isLoadingOverview ? '-' : formatNumber(overview?.totalTokens ?? 0),
      trend: overview?.trends.tokens,
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Usage Chart">
          <UsageChart
            data={usageQuery.data ?? []}
            isLoading={usageQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Cost Breakdown">
          <CostBreakdownChart
            data={providerDistQuery.data ?? []}
            isLoading={providerDistQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>

      {/* Tool Call Analytics */}
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
