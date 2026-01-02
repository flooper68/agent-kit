import { useEffect, useState } from 'react';
import { Heading, Text } from '@agent-kit/ui';
import { MessageSquare, Users, DollarSign, Coins } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import {
  TimeRangeSelector,
  UserSelector,
  StatCard,
  UsageChart,
  AgentDistributionChart,
  CostBreakdownChart,
  TokensPerUserChart,
  RecentActivityTable,
  SessionDetailModal,
} from '../../components/analytics';
import type { TimeRange } from '../../components/analytics';

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

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [userId, setUserId] = useState<string>('');

  // Pagination state - track cursor history for "previous" navigation
  const [cursors, setCursors] = useState<string[]>([]);
  const currentCursor = cursors[cursors.length - 1];

  // Modal state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    document.title = 'Analytics | Agent Kit';
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCursors([]);
  }, [userId]);

  // Convert empty string to undefined for API calls
  const userIdFilter = userId || undefined;

  // Fetch overview stats
  const overviewQuery = trpc.analytics.getOverview.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch usage over time
  const usageQuery = trpc.analytics.getUsageOverTime.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch agent distribution
  const agentDistQuery = trpc.analytics.getAgentDistribution.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch provider distribution
  const providerDistQuery = trpc.analytics.getProviderDistribution.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch tokens per user
  const tokensPerUserQuery = trpc.analytics.getTokensPerUser.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch recent activity with pagination
  const recentActivityQuery = trpc.analytics.getRecentActivity.useQuery({
    limit: 25,
    userId: userIdFilter,
    cursor: currentCursor,
  });

  const handleNextPage = () => {
    if (recentActivityQuery.data?.nextCursor) {
      setCursors([...cursors, recentActivityQuery.data.nextCursor]);
    }
  };

  const handlePreviousPage = () => {
    setCursors(cursors.slice(0, -1));
  };

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
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Heading as="h1" size="24">
              Analytics
            </Heading>
            <Text className="text-muted-foreground">
              Overview of your organization&apos;s usage and performance
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <UserSelector
              value={userId}
              onChange={setUserId}
              timeRange={timeRange}
            />
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <UsageChart
            data={usageQuery.data ?? []}
            isLoading={usageQuery.isLoading}
          />
          <AgentDistributionChart
            data={agentDistQuery.data ?? []}
            isLoading={agentDistQuery.isLoading}
          />
        </div>

        {/* Cost Breakdown & Tokens Per User */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <CostBreakdownChart
            data={providerDistQuery.data ?? []}
            isLoading={providerDistQuery.isLoading}
          />
          <TokensPerUserChart
            data={tokensPerUserQuery.data ?? []}
            isLoading={tokensPerUserQuery.isLoading}
          />
        </div>

        {/* Recent Activity */}
        <RecentActivityTable
          data={recentActivityQuery.data?.items ?? []}
          isLoading={recentActivityQuery.isLoading}
          isLoadingMore={recentActivityQuery.isFetching}
          hasNextPage={!!recentActivityQuery.data?.nextCursor}
          hasPreviousPage={cursors.length > 0}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onRowClick={setSelectedSessionId}
        />
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
