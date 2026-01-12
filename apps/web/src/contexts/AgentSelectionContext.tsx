import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { AgentType } from '@agent-kit/ui';

const STORAGE_KEY_PREFIX = 'agent-kit:lastAgentId';

/**
 * Get user-specific storage key for agent ID.
 * Returns null if userId is not available.
 */
function getStorageKey(userId: string | null | undefined): string | null {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null;
}

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
  const { userId } = useAuth();

  // Initialize to null; sync from localStorage when userId is available
  const [selectedAgentId, setSelectedAgentIdState] = useState<string | null>(
    null
  );
  const [pendingInputFocus, setPendingInputFocus] = useState(false);

  // Sync agent selection from localStorage when userId changes
  useEffect(() => {
    const storageKey = getStorageKey(userId);
    // SSR/environment safety check
    if (typeof window === 'undefined' || !window.localStorage) {
      setSelectedAgentIdState(null);
      return;
    }
    if (!storageKey) {
      setSelectedAgentIdState(null);
      return;
    }
    try {
      const savedAgentId = localStorage.getItem(storageKey);
      setSelectedAgentIdState(savedAgentId);
    } catch {
      setSelectedAgentIdState(null);
    }
  }, [userId]);

  const setSelectedAgentId = useCallback(
    (agentId: string | null) => {
      setSelectedAgentIdState(agentId);
      const storageKey = getStorageKey(userId);
      // SSR/environment safety check
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      if (!storageKey) return;
      if (agentId) {
        try {
          localStorage.setItem(storageKey, agentId);
        } catch {
          // Ignore localStorage errors (private browsing, quota exceeded)
        }
      }
    },
    [userId]
  );

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
