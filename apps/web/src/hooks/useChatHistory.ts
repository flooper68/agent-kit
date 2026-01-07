import { useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { useSession } from '../contexts/SessionContext';
import type { TaskHistoryItem, SessionFilter } from '@agent-kit/ui';

interface UseChatHistoryOptions {
  limit?: number;
  filter?: SessionFilter;
  cursor?: string;
}

interface UseChatHistoryReturn {
  sessions: TaskHistoryItem[];
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  nextCursor?: string;
  totalCount: number;
}

export function useChatHistory(
  options: UseChatHistoryOptions = {}
): UseChatHistoryReturn {
  const { limit = 20, filter = 'my_chats', cursor } = options;
  const { streamingSessionIds } = useSession();

  const sessionsQuery = trpc.sessions.list.useQuery({ limit, filter, cursor });

  const sessions = useMemo<TaskHistoryItem[]>(() => {
    if (!sessionsQuery.data?.items) return [];

    return sessionsQuery.data.items.map((session) => ({
      id: session.id,
      title: session.title || 'Untitled Chat',
      description: session.description ?? undefined,
      preview: undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      agentName: session.agentId,
      totalTokens: session.usage?.totalTokens,
      messageCount: session.messageCount,
      // Merge server state with client-side state for immediate UI feedback
      isStreaming: session.isStreaming || streamingSessionIds.has(session.id),
      // Session was spawned by another agent if it has a parent
      isSubAgent: !!session.parentSessionId,
    }));
  }, [sessionsQuery.data, streamingSessionIds]);

  return {
    sessions,
    isLoading: sessionsQuery.isLoading,
    isFetching: sessionsQuery.isFetching,
    refetch: sessionsQuery.refetch,
    nextCursor: sessionsQuery.data?.nextCursor,
    totalCount: sessionsQuery.data?.totalCount ?? 0,
  };
}
