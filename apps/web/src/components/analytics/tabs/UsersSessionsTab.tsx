import { useState, useCallback } from 'react';
import { trpc } from '../../../lib/trpc';
import { ActivitySessionStats } from '../ActivitySessionStats';
import { ActivitySessionsTable } from '../ActivitySessionsTable';
import {
  TokensPerUserChart,
  WebSearchCallsChart,
  TokensByProviderChart,
  ChartErrorBoundary,
} from '..';
import type { TimeRange } from '..';

interface UsersSessionsTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function UsersSessionsTab({ timeRange, userId }: UsersSessionsTabProps) {
  // Pagination state for activity sessions
  const [cursors, setCursors] = useState<string[]>([]);
  const currentCursor = cursors[cursors.length - 1];

  // Activity session queries
  const statsQuery = trpc.activity.getStats.useQuery({
    timeRange,
    userId,
  });

  const sessionsQuery = trpc.activity.getSessions.useQuery({
    timeRange,
    userId,
    limit: 25,
    cursor: currentCursor,
  });

  // User analytics queries
  const tokensPerUserQuery = trpc.analytics.getTokensPerUser.useQuery({
    timeRange,
    userId,
  });

  const webSearchCallsQuery = trpc.analytics.getWebSearchCalls.useQuery({
    timeRange,
    userId,
  });

  const providerDistQuery = trpc.analytics.getProviderDistribution.useQuery({
    timeRange,
    userId,
  });

  const handleNextPage = useCallback(() => {
    if (sessionsQuery.data?.nextCursor) {
      setCursors([...cursors, sessionsQuery.data.nextCursor]);
    }
  }, [sessionsQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      {/* Activity Session Stats */}
      <ActivitySessionStats
        totalSessions={stats?.totalSessions ?? 0}
        averageDurationMinutes={stats?.averageDurationMinutes ?? 0}
        sessionsPerDay={stats?.sessionsPerDay ?? 0}
        isLoading={statsQuery.isLoading}
      />

      {/* User Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tokens Per User">
          <TokensPerUserChart
            data={tokensPerUserQuery.data ?? []}
            isLoading={tokensPerUserQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Web Search Calls">
          <WebSearchCallsChart
            data={webSearchCallsQuery.data ?? []}
            isLoading={webSearchCallsQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tokens by Provider">
          <TokensByProviderChart
            data={providerDistQuery.data ?? []}
            isLoading={providerDistQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>

      {/* Activity Sessions Table */}
      <ActivitySessionsTable
        data={sessionsQuery.data?.items ?? []}
        isLoading={sessionsQuery.isLoading}
        isLoadingMore={sessionsQuery.isFetching}
        hasNextPage={!!sessionsQuery.data?.nextCursor}
        hasPreviousPage={cursors.length > 0}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
      />
    </div>
  );
}
