import { useState, useCallback } from 'react';
import { trpc } from '../../../lib/trpc';
import { ActivitySessionStats } from '../ActivitySessionStats';
import { ActivitySessionsTable } from '../ActivitySessionsTable';
import type { TimeRange } from '..';

interface SessionsCostsTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function SessionsCostsTab({ timeRange, userId }: SessionsCostsTabProps) {
  // Pagination state
  const [cursors, setCursors] = useState<string[]>([]);
  const currentCursor = cursors[cursors.length - 1];

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
      {/* Stats Cards */}
      <ActivitySessionStats
        totalSessions={stats?.totalSessions ?? 0}
        averageDurationMinutes={stats?.averageDurationMinutes ?? 0}
        averageCostPerSession={stats?.averageCostPerSession ?? 0}
        sessionsPerDay={stats?.sessionsPerDay ?? 0}
        isLoading={statsQuery.isLoading}
      />

      {/* Sessions Table */}
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
