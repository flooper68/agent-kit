import { useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { useSession } from '../contexts/SessionContext';
import type { TaskHistoryItem } from '@agent-kit/ui';

interface UseChatHistoryOptions {
  limit?: number;
}

interface UseChatHistoryReturn {
  sessions: TaskHistoryItem[];
  isLoading: boolean;
  refetch: () => void;
}

export function useChatHistory(
  options: UseChatHistoryOptions = {}
): UseChatHistoryReturn {
  const { limit = 20 } = options;
  const { streamingSessionIds } = useSession();

  const sessionsQuery = trpc.sessions.list.useQuery({ limit });

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
    }));
  }, [sessionsQuery.data, streamingSessionIds]);

  return {
    sessions,
    isLoading: sessionsQuery.isLoading,
    refetch: sessionsQuery.refetch,
  };
}
