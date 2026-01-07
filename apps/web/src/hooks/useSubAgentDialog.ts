import { useState, useCallback, useMemo } from 'react';
import type { AgentType } from '@agent-kit/ui';
import { trpc } from '../lib/trpc';

export interface UseSubAgentDialogReturn {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Current session ID being viewed */
  currentSessionId: string | null;

  /** Open dialog with a session */
  openDialog: (sessionId: string) => void;
  /** Close dialog and reset state */
  closeDialog: () => void;
  /** Navigate to a different session (for nested sub-agents) */
  navigateTo: (sessionId: string) => void;

  /** Session data (agent name, usage) */
  sessionData: {
    agentName?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
  };

  /** Full agent definition resolved from agentId */
  agent?: AgentType;
}

export function useSubAgentDialog(
  agents: AgentType[]
): UseSubAgentDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Query session data when dialog is open
  const sessionQuery = trpc.sessions.get.useQuery(
    { sessionId: currentSessionId! },
    { enabled: isOpen && !!currentSessionId }
  );

  const openDialog = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCurrentSessionId(null);
  }, []);

  // Navigate to a different session (for viewing nested sub-agents)
  const navigateTo = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // Extract session data
  const sessionData = useMemo(() => {
    const data = sessionQuery.data as
      | {
          agentId?: string;
          agentName?: string;
          usage?: {
            promptTokens: number;
            completionTokens: number;
          };
        }
      | undefined;

    if (!data) {
      return {};
    }

    return {
      // Prefer agentName (full display name) over agentId (key for spawning)
      agentName: data.agentName ?? data.agentId,
      usage: data.usage
        ? {
            promptTokens: data.usage.promptTokens,
            completionTokens: data.usage.completionTokens,
          }
        : undefined,
    };
  }, [sessionQuery.data]);

  // Resolve full agent definition from agentId
  const agent = useMemo(() => {
    const agentId = (sessionQuery.data as { agentId?: string } | undefined)
      ?.agentId;
    if (!agentId) return undefined;
    return agents.find((a) => a.id === agentId);
  }, [sessionQuery.data, agents]);

  return {
    isOpen,
    currentSessionId,
    openDialog,
    closeDialog,
    navigateTo,
    sessionData,
    agent,
  };
}
