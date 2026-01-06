import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { AgentType } from '@agent-kit/ui';

interface AgentSelectionContextValue {
  selectedAgentId: string | null;
  setSelectedAgentId: (agentId: string | null) => void;
  pendingInputFocus: boolean;
  requestInputFocus: () => void;
  clearInputFocus: () => void;
}

const AgentSelectionContext = createContext<AgentSelectionContextValue | null>(
  null
);

export function AgentSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedAgentId, setSelectedAgentIdState] = useState<string | null>(
    () => {
      // SSR/environment safety check - localStorage may not exist
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      try {
        return localStorage.getItem('agent-kit:lastAgentId');
      } catch {
        // Handle errors from private browsing modes or quota exceeded
        return null;
      }
    }
  );
  const [pendingInputFocus, setPendingInputFocus] = useState(false);

  const setSelectedAgentId = useCallback((agentId: string | null) => {
    setSelectedAgentIdState(agentId);
    if (agentId) {
      // SSR/environment safety check
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      try {
        localStorage.setItem('agent-kit:lastAgentId', agentId);
      } catch {
        // Ignore localStorage errors (private browsing, quota exceeded)
      }
    }
  }, []);

  const requestInputFocus = useCallback(() => {
    setPendingInputFocus(true);
  }, []);

  const clearInputFocus = useCallback(() => {
    setPendingInputFocus(false);
  }, []);

  return (
    <AgentSelectionContext.Provider
      value={{
        selectedAgentId,
        setSelectedAgentId,
        pendingInputFocus,
        requestInputFocus,
        clearInputFocus,
      }}
    >
      {children}
    </AgentSelectionContext.Provider>
  );
}

export function useAgentSelection(): AgentSelectionContextValue {
  const context = useContext(AgentSelectionContext);
  if (!context) {
    throw new Error(
      'useAgentSelection must be used within an AgentSelectionProvider'
    );
  }
  return context;
}

// Hook to handle agent selection from command palette
export function useAgentSelectHandler() {
  const { setSelectedAgentId, requestInputFocus } = useAgentSelection();

  const handleAgentSelect = useCallback(
    (agent: AgentType) => {
      setSelectedAgentId(agent.id);
      requestInputFocus();
    },
    [setSelectedAgentId, requestInputFocus]
  );

  return handleAgentSelect;
}
