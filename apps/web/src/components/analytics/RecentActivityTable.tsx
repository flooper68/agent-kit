import { Heading, Text, Pagination } from '@agent-kit/ui';

interface RecentActivityItem {
  sessionId: string;
  userId: string;
  agentId: string;
  agentName: string;
  title: string | null;
  status: string;
  messageCount: number;
  updatedAt: Date | string;
}

interface RecentActivityTableProps {
  data: RecentActivityItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onRowClick?: (sessionId: string) => void;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusBadge(status: string) {
  const statusStyles: Record<string, string> = {
    active:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status] ?? statusStyles.cancelled}`}
    >
      {status}
    </span>
  );
}

function getUserInitials(userId: string): string {
  // Take first 2 characters of the user ID as initials
  return userId.slice(0, 2).toUpperCase();
}

export function RecentActivityTable({
  data,
  isLoading,
  isLoadingMore,
  hasNextPage = false,
  hasPreviousPage = false,
  onNextPage,
  onPreviousPage,
  onRowClick,
}: RecentActivityTableProps) {
  const showPagination =
    (hasNextPage || hasPreviousPage) && onNextPage && onPreviousPage;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <Heading as="h3" size="16" className="mb-4">
          Recent Activity
        </Heading>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <Heading as="h3" size="16" className="mb-4">
          Recent Activity
        </Heading>
        <div className="py-8 text-center">
          <Text className="text-muted-foreground">No recent activity</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <Heading as="h3" size="16" className="mb-4">
        Recent Activity
      </Heading>
      <div className="space-y-4">
        {data.map((activity) => (
          <div
            key={activity.sessionId}
            onClick={() => onRowClick?.(activity.sessionId)}
            className={`flex items-center justify-between py-2 border-b border-border last:border-0 ${
              onRowClick
                ? 'cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors'
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  {getUserInitials(activity.userId)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Text className="font-medium">
                    {activity.title ?? 'Untitled session'}
                  </Text>
                  {getStatusBadge(activity.status)}
                </div>
                <Text className="text-sm text-muted-foreground">
                  {activity.agentName} &middot; {activity.messageCount} messages
                </Text>
              </div>
            </div>
            <Text className="text-sm text-muted-foreground">
              {formatTimeAgo(activity.updatedAt)}
            </Text>
          </div>
        ))}
      </div>
      {showPagination && (
        <div className="mt-4 pt-4 border-t border-border">
          <Pagination
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onNextPage={onNextPage}
            onPreviousPage={onPreviousPage}
            isLoading={isLoadingMore}
          />
        </div>
      )}
    </div>
  );
}
