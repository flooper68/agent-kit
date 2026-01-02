import { useState, useCallback, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AgentPanel } from '@agent-kit/ui';
import type { AgentType, TaskHistoryItem, SuggestionChip } from '@agent-kit/ui';
import { trpc } from '../lib/trpc';
import { useAgentSession } from '../hooks/useAgentSession';
import { useSession } from '../contexts/SessionContext';

interface AppAgentPanelProps {
  /** Callback when user wants to start a new chat */
  onNewChat?: () => void;
  emptyStateConfig?: {
    title?: string;
    description?: string;
  };
  suggestions?: Array<{ id: string; text: string }>;
  recentChats?: TaskHistoryItem[];
  onRecentChatClick?: (chat: TaskHistoryItem) => void;
  className?: string;
}

export function AppAgentPanel({
  onNewChat,
  emptyStateConfig,
  suggestions,
  recentChats,
  onRecentChatClick,
  className,
}: AppAgentPanelProps) {
  const { sessionId, setSessionId } = useSession();
  const { user } = useUser();
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  // Fetch available agents
  const agentsQuery = trpc.agents.list.useQuery();

  // Create session mutation
  const createSessionMutation = trpc.sessions.create.useMutation();

  // Use the agent session hook
  const {
    messages,
    status,
    thinkingStatus,
    sendMessage,
    interrupt,
    error,
    retry,
    dismissError,
    contextUsage,
  } = useAgentSession({
    sessionId,
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

  // Auto-select first agent when available and no session exists
  useEffect(() => {
    if (!sessionId && !selectedAgent && agents.length > 0) {
      const firstAgent = agents[0];
      if (firstAgent) {
        setSelectedAgent(firstAgent);
      }
    }
  }, [sessionId, selectedAgent, agents]);

  // Create avatars config from logged-in user
  const avatars = useMemo(
    () => ({
      user: {
        src: user?.imageUrl,
        fallback: user?.fullName?.charAt(0).toUpperCase() ?? 'U',
        name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress,
      },
      assistant: {
        fallback: 'AI',
        name: 'Assistant',
      },
    }),
    [user]
  );

  // Handle agent selection
  const handleAgentSelect = useCallback(
    async (agent: AgentType) => {
      setSelectedAgent(agent);

      // Create a new session with this agent
      try {
        const session = await createSessionMutation.mutateAsync({
          agentId: agent.id,
        });
        if (session) {
          // Set the session ID in global context
          setSessionId(session.id);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },
    [createSessionMutation, setSessionId]
  );

  const handleSend = useCallback(
    async (message: string) => {
      let currentSessionId = sessionId;

      // If no session yet, create one with the selected agent (or first agent as fallback)
      if (!currentSessionId) {
        const agentToUse = selectedAgent || agents[0];
        if (agentToUse) {
          try {
            const session = await createSessionMutation.mutateAsync({
              agentId: agentToUse.id,
            });
            if (session) {
              currentSessionId = session.id;
              setSelectedAgent(agentToUse);
              // Set the session ID in global context
              setSessionId(session.id);
            }
          } catch (error) {
            console.error('Failed to create session:', error);
            return;
          }
        }
      }

      if (currentSessionId) {
        // Pass sessionId explicitly in case state hasn't updated yet
        await sendMessage(message, currentSessionId);
      }
    },
    [
      sessionId,
      selectedAgent,
      agents,
      createSessionMutation,
      sendMessage,
      setSessionId,
    ]
  );

  const handleInterrupt = useCallback(() => {
    interrupt();
  }, [interrupt]);

  const handleRetry = useCallback(() => {
    retry();
  }, [retry]);

  const handleErrorDismiss = useCallback(() => {
    dismissError();
  }, [dismissError]);

  const handleSuggestionClick = useCallback(
    (suggestion: SuggestionChip) => {
      handleSend(suggestion.text);
    },
    [handleSend]
  );

  return (
    <AgentPanel
      className={className}
      messages={messages}
      status={status}
      thinkingStatus={thinkingStatus}
      avatars={avatars}
      agents={agents}
      selectedAgent={selectedAgent || undefined}
      isAgentSelectorDisabled={!!sessionId}
      contextUsage={contextUsage ?? undefined}
      emptyStateConfig={emptyStateConfig}
      suggestions={suggestions}
      onSuggestionClick={handleSuggestionClick}
      recentChats={recentChats}
      error={error ?? undefined}
      onSend={handleSend}
      onInterrupt={handleInterrupt}
      onAgentSelect={handleAgentSelect}
      onRecentChatClick={onRecentChatClick}
      onCreateNewTask={onNewChat}
      onRetry={handleRetry}
      onErrorDismiss={handleErrorDismiss}
    />
  );
}
