import { useCallback, useEffect, useMemo } from 'react';
import type { TaskHistoryItem, AgentType } from '@agent-kit/ui';
import { AppAgentPanel } from '../components/AppAgentPanel';
import { DashboardPageSkeleton } from '../components/skeletons';
import { useChatHistory } from '../hooks/useChatHistory';
import { useSession } from '../contexts/SessionContext';
import { useAgentSelection } from '../contexts/AgentSelectionContext';
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
  const {
    selectedAgentId,
    setSelectedAgentId,
    pendingInputFocus,
    clearInputFocus,
  } = useAgentSelection();

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
      description: agent.description ?? undefined,
      isLocal: agent.isLocal,
      isFavorite: agent.isFavorite,
      model: agent.model ?? undefined,
      provider: agent.provider ?? undefined,
      // External agents are disabled when not connected (server agents are always enabled)
      disabled: false,
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

  const handleAgentSelect = useCallback(
    (agent: AgentType) => {
      setSelectedAgentId(agent.id);
    },
    [setSelectedAgentId]
  );

  const handleInputFocused = useCallback(() => {
    clearInputFocus();
  }, [clearInputFocus]);

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
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
        onNewChat={handleNewChat}
        pendingInputFocus={pendingInputFocus}
        onInputFocused={handleInputFocused}
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
