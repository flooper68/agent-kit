import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useAuth } from '@clerk/clerk-react';

const STORAGE_KEY_PREFIX = 'agent-kit:lastSessionId';

/**
 * Get user-specific storage key for session ID.
 * Returns null if userId is not available.
 */
function getStorageKey(userId: string | null | undefined): string | null {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null;
}

/**
 * Check if localStorage is available.
 * Handles cases where localStorage is disabled (private browsing, SSR, etc.)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Cache the result to avoid repeated checks
const storageAvailable = isLocalStorageAvailable();

interface SessionContextValue {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  clearSession: () => void;
  // Track which sessions are currently streaming (client-side state for immediate UI feedback)
  streamingSessionIds: Set<string>;
  setSessionStreaming: (sessionId: string, isStreaming: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();

  // Initialize to null; sync from localStorage when userId is available
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  // Track streaming sessions client-side for immediate UI feedback
  // This eliminates race conditions with pub/sub event propagation
  const [streamingSessionIds, setStreamingSessionIds] = useState<Set<string>>(
    new Set()
  );

  // Sync session state from localStorage when userId changes
  useEffect(() => {
    const storageKey = getStorageKey(userId);
    if (!storageKey || !storageAvailable) {
      setSessionIdState(null);
      return;
    }
    try {
      const savedSession = localStorage.getItem(storageKey);
      setSessionIdState(savedSession);
    } catch {
      setSessionIdState(null);
    }
  }, [userId]);

  const setSessionStreaming = useCallback(
    (sessionId: string, isStreaming: boolean) => {
      setStreamingSessionIds((prev) => {
        const next = new Set(prev);
        if (isStreaming) {
          next.add(sessionId);
        } else {
          next.delete(sessionId);
        }
        return next;
      });
    },
    []
  );

  const setSessionId = useCallback(
    (id: string | null) => {
      setSessionIdState(id);
      const storageKey = getStorageKey(userId);
      if (!storageAvailable || !storageKey) return;
      try {
        if (id) {
          localStorage.setItem(storageKey, id);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // Ignore localStorage errors
      }
    },
    [userId]
  );

  const clearSession = useCallback(() => {
    setSessionIdState(null);
    const storageKey = getStorageKey(userId);
    if (!storageAvailable || !storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore localStorage errors
    }
  }, [userId]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        setSessionId,
        clearSession,
        streamingSessionIds,
        setSessionStreaming,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
