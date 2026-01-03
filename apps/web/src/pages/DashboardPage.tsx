import { useCallback, useEffect, useMemo } from 'react';
import type { TaskHistoryItem, AgentType } from '@agent-kit/ui';
import { AppAgentPanel } from '../components/AppAgentPanel';
import { DashboardPageSkeleton } from '../components/skeletons';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSession } from '../contexts/SessionContext';
import { trpc } from '../lib/trpc';

export function DashboardPage() {
  const {
    sessions,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useChatHistory({
    limit: 3,
  });
  const agentsQuery = trpc.agents.list.useQuery();
  const { setSessionId, clearSession } = useSession();

  // Delete session mutation
  const deleteSessionMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      refetchSessions();
    },
  });

  // Map server agents to UI AgentType format
  const agents: AgentType[] = useMemo(() => {
    return (agentsQuery.data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      tools: agent.tools,
      model: agent.model,
      provider: agent.provider,
    }));
  }, [agentsQuery.data]);

  // Show skeleton while any critical data is loading
  const isLoading = isSessionsLoading || agentsQuery.isLoading;

  useEffect(() => {
    document.title = 'Agents | Agent Kit';
  }, []);

  const handleRecentChatClick = useCallback(
    (chat: TaskHistoryItem) => {
      setSessionId(chat.id);
    },
    [setSessionId]
  );

  const handleNewChat = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const handleRecentChatDelete = useCallback(
    async (chat: TaskHistoryItem) => {
      try {
        await deleteSessionMutation.mutateAsync({ sessionId: chat.id });
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [deleteSessionMutation]
  );

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="h-full">
      <AppAgentPanel
        agents={agents}
        onNewChat={handleNewChat}
        emptyStateConfig={{
          title: 'How can I help?',
          description: 'Ask me anything or try one of the suggestions below.',
        }}
        suggestions={[
          { id: '1', text: 'What time is it?' },
          { id: '2', text: 'Tell me a joke' },
          { id: '3', text: 'Help me with code' },
        ]}
        recentChats={sessions}
        onRecentChatClick={handleRecentChatClick}
        onRecentChatDelete={handleRecentChatDelete}
      />
    </div>
  );
}
