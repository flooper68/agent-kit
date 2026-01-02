import { useState, useCallback, useMemo } from 'react';
import { AgentPanel } from '@agent-kit/ui';
import type { AgentType } from '@agent-kit/ui';
import { trpc } from '../lib/trpc';
import { useAgentSession } from '../hooks/useAgentSession';

interface AppAgentPanelProps {
  emptyStateConfig?: {
    title?: string;
    description?: string;
  };
  suggestions?: Array<{ id: string; text: string }>;
  className?: string;
}

export function AppAgentPanel({
  emptyStateConfig,
  suggestions,
  className,
}: AppAgentPanelProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  // Fetch available agents
  const agentsQuery = trpc.agents.list.useQuery();

  // Create session mutation
  const createSessionMutation = trpc.sessions.create.useMutation();

  // Use the agent session hook
  const { messages, status, thinkingStatus, sendMessage, interrupt } =
    useAgentSession({
      sessionId: selectedSessionId,
    });

  // Map server agents to UI AgentType format
  const agents: AgentType[] = useMemo(() => {
    return (agentsQuery.data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
    }));
  }, [agentsQuery.data]);

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
          setSelectedSessionId(session.id);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },
    [createSessionMutation]
  );

  const handleSend = useCallback(
    async (message: string) => {
      let sessionId = selectedSessionId;

      // If no session yet, create one with the first agent
      if (!sessionId && agents.length > 0) {
        const firstAgent = agents[0];
        if (firstAgent) {
          try {
            const session = await createSessionMutation.mutateAsync({
              agentId: firstAgent.id,
            });
            if (session) {
              sessionId = session.id;
              setSelectedSessionId(session.id);
              setSelectedAgent(firstAgent);
            }
          } catch (error) {
            console.error('Failed to create session:', error);
            return;
          }
        }
      }

      if (sessionId) {
        // Pass sessionId explicitly in case state hasn't updated yet
        await sendMessage(message, sessionId);
      }
    },
    [selectedSessionId, agents, createSessionMutation, sendMessage]
  );

  const handleInterrupt = useCallback(() => {
    interrupt();
  }, [interrupt]);

  return (
    <AgentPanel
      className={className}
      messages={messages}
      status={status}
      thinkingStatus={thinkingStatus}
      agents={agents}
      selectedAgent={selectedAgent || undefined}
      emptyStateConfig={emptyStateConfig}
      suggestions={suggestions}
      onSend={handleSend}
      onInterrupt={handleInterrupt}
      onAgentSelect={handleAgentSelect}
    />
  );
}
