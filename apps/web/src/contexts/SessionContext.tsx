import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY_SESSION = 'agent-kit:lastSessionId';

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
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    if (!storageAvailable) return null;
    try {
      return localStorage.getItem(STORAGE_KEY_SESSION);
    } catch {
      return null;
    }
  });

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
    if (!storageAvailable) return;
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY_SESSION, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionIdState(null);
    if (!storageAvailable) return;
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, clearSession }}>
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
