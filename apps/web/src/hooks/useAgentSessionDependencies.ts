/**
 * Default dependencies for useAgentSession hook.
 * Wraps tRPC calls to enable dependency injection for testing.
 */

import { trpc, getConnectionState } from '../lib/trpc';
import type {
  AgentSessionDependencies,
  SessionData,
} from './useAgentSession.types';

/**
 * Creates the default tRPC-based dependencies for useAgentSession.
 * These are the production dependencies that connect to the real server.
 */
export function createDefaultDependencies(): AgentSessionDependencies {
  return {
    useSessionQuery: (sessionId) => {
      const query = trpc.sessions.get.useQuery(
        { sessionId: sessionId! },
        { enabled: !!sessionId }
      );
      return {
        data: query.data as SessionData | undefined,
        isSuccess: query.isSuccess,
        isError: query.isError,
      };
    },

    useMessageSubscription: (input, options) => {
      const subscription = trpc.messages.subscribe.useSubscription(
        {
          sessionId: input.sessionId,
          lastEventId: input.lastEventId,
          replayHistory: input.replayHistory,
        },
        {
          enabled: options.enabled,
          onData: options.onData as (event: unknown) => void,
          onError: options.onError,
        }
      );
      return {
        status: subscription.status as
          | 'idle'
          | 'connecting'
          | 'pending'
          | 'error',
        error: subscription.error ?? null,
      };
    },

    useSendMutation: () => {
      return trpc.messages.send.useMutation();
    },

    useInterruptMutation: () => {
      return trpc.messages.interrupt.useMutation();
    },

    getConnectionState,
  };
}

// Singleton instance for default dependencies
let defaultDeps: AgentSessionDependencies | null = null;

/**
 * Gets the default dependencies singleton.
 * This ensures consistent hook behavior across renders.
 */
export function getDefaultDependencies(): AgentSessionDependencies {
  if (!defaultDeps) {
    defaultDeps = createDefaultDependencies();
  }
  return defaultDeps;
}
