import {
  MessageSquare,
  Users,
  DollarSign,
  Coins,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import {
  StatCard,
  UsageChart,
  CostBreakdownChart,
  ChartErrorBoundary,
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

  const artifactsStatsQuery = trpc.artifacts.getStats.useQuery({
    timeRange,
  });

  const projectStatsQuery = trpc.analytics.getProjectStats.useQuery();

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
    {
      label: 'Total Artifacts',
      value: artifactsStatsQuery.isLoading
        ? '-'
        : formatNumber(artifactsStatsQuery.data?.totalCount ?? 0),
      trend: undefined,
      icon: FileText,
    },
    {
      label: 'Projects',
      value: projectStatsQuery.isLoading
        ? '-'
        : formatNumber(projectStatsQuery.data?.totalProjects ?? 0),
      trend: undefined,
      icon: FolderKanban,
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
    </div>
  );
}
