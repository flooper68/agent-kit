import { useEffect, useState } from 'react';
import { Heading, Text } from '@agent-kit/ui';
import {
  MessageSquare,
  Users,
  DollarSign,
  Coins,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import {
  TimeRangeSelector,
  UserSelector,
  StatCard,
  UsageChart,
  AgentDistributionChart,
  CostBreakdownChart,
  TokensByProviderChart,
  TokensPerUserChart,
  WebSearchCallsChart,
  RecentActivityTable,
  SessionDetailModal,
  ChartErrorBoundary,
  TasksByStatusChart,
  TasksByPriorityChart,
  SessionLengthChart,
  ToolTypeDistributionChart,
  ToolCallsPerSessionCard,
  ToolCallErrorsChart,
} from '../../components/analytics';
import { ArtifactsCreationChart } from '../../components/analytics/ArtifactsCreationChart';
import { ArtifactsByAgentChart } from '../../components/analytics/ArtifactsByAgentChart';
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

  // Fetch web search calls
  const webSearchCallsQuery = trpc.analytics.getWebSearchCalls.useQuery({
    timeRange,
    userId: userIdFilter,
  });

  // Fetch recent activity with pagination
  const recentActivityQuery = trpc.analytics.getRecentActivity.useQuery({
    limit: 25,
    userId: userIdFilter,
    cursor: currentCursor,
  });

  // Fetch artifacts analytics
  const artifactsStatsQuery = trpc.artifacts.getStats.useQuery({
    timeRange,
  });

  const artifactsOverTimeQuery = trpc.artifacts.getOverTime.useQuery({
    timeRange,
  });

  const artifactsByAgentQuery = trpc.artifacts.getByAgent.useQuery({
    timeRange,
  });

  // Fetch project and task analytics
  const projectStatsQuery = trpc.analytics.getProjectStats.useQuery();
  const taskStatsQuery = trpc.analytics.getTaskStats.useQuery();

  // Fetch tool call analytics
  const sessionLengthQuery =
    trpc.analytics.getSessionLengthDistribution.useQuery({
      timeRange,
      userId: userIdFilter,
    });

  const toolCallsPerSessionQuery =
    trpc.analytics.getToolCallsPerSession.useQuery({
      timeRange,
      userId: userIdFilter,
    });

  const toolTypeDistributionQuery =
    trpc.analytics.getToolTypeDistribution.useQuery({
      timeRange,
      userId: userIdFilter,
    });

  const toolCallErrorsQuery = trpc.analytics.getToolCallErrors.useQuery({
    timeRange,
    userId: userIdFilter,
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
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          <ChartErrorBoundary chartName="Usage Chart">
            <UsageChart
              data={usageQuery.data ?? []}
              isLoading={usageQuery.isLoading}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary chartName="Agent Distribution">
            <AgentDistributionChart
              data={agentDistQuery.data ?? []}
              isLoading={agentDistQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* Provider Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ChartErrorBoundary chartName="Cost Breakdown">
            <CostBreakdownChart
              data={providerDistQuery.data ?? []}
              isLoading={providerDistQuery.isLoading}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary chartName="Tokens by Provider">
            <TokensByProviderChart
              data={providerDistQuery.data ?? []}
              isLoading={providerDistQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* User Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ChartErrorBoundary chartName="Tokens Per User">
            <TokensPerUserChart
              data={tokensPerUserQuery.data ?? []}
              isLoading={tokensPerUserQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* Web Search Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ChartErrorBoundary chartName="Web Search Calls">
            <WebSearchCallsChart
              data={webSearchCallsQuery.data ?? []}
              isLoading={webSearchCallsQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* Artifacts Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ChartErrorBoundary chartName="Artifacts Created">
            <ArtifactsCreationChart
              data={artifactsOverTimeQuery.data ?? []}
              isLoading={artifactsOverTimeQuery.isLoading}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary chartName="Artifacts by Agent">
            <ArtifactsByAgentChart
              data={artifactsByAgentQuery.data ?? []}
              isLoading={artifactsByAgentQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* Task Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ChartErrorBoundary chartName="Tasks by Status">
            <TasksByStatusChart
              data={taskStatsQuery.data}
              isLoading={taskStatsQuery.isLoading}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary chartName="Tasks by Priority">
            <TasksByPriorityChart
              data={taskStatsQuery.data}
              isLoading={taskStatsQuery.isLoading}
            />
          </ChartErrorBoundary>
        </div>

        {/* Tool Call Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
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

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
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
        onNavigateToSession={setSelectedSessionId}
      />
    </div>
  );
}
