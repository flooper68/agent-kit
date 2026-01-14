import { useState, useCallback } from 'react';
import { trpc } from '../../../lib/trpc';
import { ActivitySessionStats } from '../ActivitySessionStats';
import { ActivitySessionsTable } from '../ActivitySessionsTable';
import { SessionsTimelineChart } from '../SessionsTimelineChart';
import { ChartErrorBoundary } from '..';
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

  // Sessions timeline query
  const timelineQuery = trpc.activity.getSessionsTimeline.useQuery({
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

      {/* Sessions Timeline Chart */}
      <ChartErrorBoundary chartName="Sessions Timeline">
        <SessionsTimelineChart
          data={timelineQuery.data?.users ?? []}
          timeRange={
            timelineQuery.data?.timeRange ?? {
              start: new Date().toISOString(),
              end: new Date().toISOString(),
            }
          }
          isLoading={timelineQuery.isLoading}
        />
      </ChartErrorBoundary>

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
