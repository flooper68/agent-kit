import { useMemo } from 'react';
import { trpc } from '../lib/trpc';
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

  const sessionsQuery = trpc.sessions.list.useQuery({ limit });

  const sessions = useMemo<TaskHistoryItem[]>(() => {
    if (!sessionsQuery.data?.items) return [];

    return sessionsQuery.data.items.map((session) => ({
      id: session.id,
      title: session.title || 'Untitled Chat',
      preview: undefined,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    }));
  }, [sessionsQuery.data]);

  return {
    sessions,
    isLoading: sessionsQuery.isLoading,
    refetch: sessionsQuery.refetch,
  };
}
