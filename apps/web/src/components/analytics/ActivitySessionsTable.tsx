import { Heading, Text, Button } from '@agent-kit/ui';
import { ChevronLeft, ChevronRight, Clock, DollarSign, Coins, Bot } from 'lucide-react';

interface ActivitySession {
  id: string;
  userId: string;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
  durationMinutes: number;
  estimatedCost: number;
  totalTokens: number;
  agentSessionsCount: number;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface ActivitySessionsTableProps {
  data: ActivitySession[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getUserDisplayName(session: ActivitySession): string {
  if (session.firstName || session.lastName) {
    return [session.firstName, session.lastName].filter(Boolean).join(' ');
  }
  if (session.email) {
    return session.email;
  }
  return session.userId.slice(0, 8) + '...';
}

export function ActivitySessionsTable({
  data,
  isLoading,
  isLoadingMore,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
}: ActivitySessionsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-6 pb-4">
          <Heading as="h3" size="16">
            Activity Sessions
          </Heading>
        </div>
        <div className="p-6 pt-0">
          <div className="flex h-48 items-center justify-center">
            <Text className="text-muted-foreground">Loading...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-6 pb-4">
          <Heading as="h3" size="16">
            Activity Sessions
          </Heading>
        </div>
        <div className="p-6 pt-0">
          <div className="flex h-48 items-center justify-center">
            <Text className="text-muted-foreground">No activity sessions found</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-row items-center justify-between p-6 pb-4">
        <Heading as="h3" size="16">
          Activity Sessions
        </Heading>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage || isLoadingMore}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage || isLoadingMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Started</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Agent Sessions</th>
                <th className="pb-3 font-medium">Tokens</th>
                <th className="pb-3 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((session) => (
                <tr key={session.id} className="text-sm">
                  <td className="py-3">
                    <span className="font-medium">
                      {getUserDisplayName(session)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col">
                      <span>{formatDate(session.startedAt)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(session.startedAt)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDuration(session.durationMinutes)}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{session.agentSessionsCount}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatNumber(session.totalTokens)}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatCurrency(session.estimatedCost)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
