import { useState, useCallback } from 'react';
import { trpc } from '../../../lib/trpc';
import { RecentActivityTable, SessionDetailModal } from '..';

interface SessionAuditTabProps {
  userId?: string;
}

export function SessionAuditTab({ userId }: SessionAuditTabProps) {
  // Pagination state - track cursor history for "previous" navigation
  const [cursors, setCursors] = useState<string[]>([]);
  const currentCursor = cursors[cursors.length - 1];

  // Modal state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const recentActivityQuery = trpc.analytics.getRecentActivity.useQuery({
    limit: 25,
    userId,
    cursor: currentCursor,
  });

  const handleNextPage = useCallback(() => {
    if (recentActivityQuery.data?.nextCursor) {
      setCursors([...cursors, recentActivityQuery.data.nextCursor]);
    }
  }, [recentActivityQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  return (
    <div className="space-y-6">
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

      <SessionDetailModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        onNavigateToSession={setSelectedSessionId}
      />
    </div>
  );
}
