import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY_SESSION = 'agent-kit:lastSessionId';

interface SessionContextValue {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SESSION);
    } catch {
      return null;
    }
  });

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY_SESSION, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {
      // Ignore localStorage errors (e.g., private browsing)
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionIdState(null);
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
