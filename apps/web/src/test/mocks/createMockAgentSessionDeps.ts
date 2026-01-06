/**
 * Mock factory for useAgentSession dependencies.
 * Provides controlled subscription events for testing.
 */

import { vi } from 'vitest';
import type {
  AgentSessionDependencies,
  SessionData,
  StreamEvent,
} from '../../hooks/useAgentSession.types';

export interface MockSubscriptionControl {
  /** Emit an event to the subscription's onData handler */
  emit: (event: StreamEvent) => void;
  /** Emit an error to the subscription's onError handler */
  emitError: (error: Error) => void;
  /** Check if subscription is enabled */
  isEnabled: () => boolean;
  /** Get the lastEventId passed to the subscription */
  getLastEventId: () => string | undefined;
  /** Get the replayHistory flag passed to the subscription */
  getReplayHistory: () => boolean | undefined;
}

export interface MockDepsResult {
  deps: AgentSessionDependencies;
  subscriptionControl: MockSubscriptionControl;
  mockSend: ReturnType<typeof vi.fn>;
  mockInterrupt: ReturnType<typeof vi.fn>;
  setSessionData: (data: SessionData | undefined) => void;
  getSessionData: () => SessionData | undefined;
}

/**
 * Creates mock dependencies for testing useAgentSession.
 *
 * @param initialSessionData - Initial session data (optional)
 * @returns Mock dependencies and control functions
 */
export function createMockAgentSessionDeps(
  initialSessionData?: Partial<SessionData>
): MockDepsResult {
  let sessionData: SessionData | undefined = initialSessionData
    ? {
        id: 'test-session',
        agentId: 'test-agent',
        messages: [],
        isStreaming: false,
        ...initialSessionData,
      }
    : undefined;

  let subscriptionOnData: ((event: StreamEvent) => void) | null = null;
  let subscriptionOnError: ((error: Error) => void) | null = null;
  let subscriptionEnabled = false;
  let subscriptionLastEventId: string | undefined = undefined;
  let subscriptionReplayHistory: boolean | undefined = undefined;

  const mockSend = vi.fn().mockResolvedValue({ sessionId: 'test-session' });
  const mockInterrupt = vi.fn().mockResolvedValue({ success: true });

  const subscriptionControl: MockSubscriptionControl = {
    emit: (event) => {
      if (subscriptionOnData) {
        subscriptionOnData(event);
      }
    },
    emitError: (error) => {
      if (subscriptionOnError) {
        subscriptionOnError(error);
      }
    },
    isEnabled: () => subscriptionEnabled,
    getLastEventId: () => subscriptionLastEventId,
    getReplayHistory: () => subscriptionReplayHistory,
  };

  const deps: AgentSessionDependencies = {
    useSessionQuery: (_sessionId) => ({
      data: sessionData,
      isSuccess: !!sessionData,
      isError: false,
    }),

    useMessageSubscription: (input, options) => {
      subscriptionOnData = options.onData;
      subscriptionOnError = options.onError;
      subscriptionEnabled = options.enabled;
      subscriptionLastEventId = input.lastEventId;
      subscriptionReplayHistory = input.replayHistory;
      return {
        status: options.enabled ? 'idle' : 'pending',
        error: null,
      };
    },

    useSendMutation: () => ({ mutateAsync: mockSend }),

    useInterruptMutation: () => ({ mutateAsync: mockInterrupt }),

    getConnectionState: () => ({ reconnectAttempts: 0 }),
  };

  return {
    deps,
    subscriptionControl,
    mockSend,
    mockInterrupt,
    setSessionData: (data) => {
      sessionData = data;
    },
    getSessionData: () => sessionData,
  };
}

// Helper to create events with unique IDs
let eventCounter = 0;

/**
 * Reset the event counter (call in beforeEach)
 */
export function resetEventCounter(): void {
  eventCounter = 0;
}

/**
 * Create a stream event with auto-generated unique ID.
 *
 * @param type - Event type
 * @param messageId - Message ID for the event
 * @param extra - Additional event-specific properties
 * @returns Complete StreamEvent
 */
export function createEvent<T extends StreamEvent['type']>(
  type: T,
  messageId: string,
  extra: Omit<
    Extract<StreamEvent, { type: T }>,
    'id' | 'type' | 'sessionId' | 'messageId' | 'timestamp'
  >
): StreamEvent {
  return {
    id: `evt-${++eventCounter}`,
    type,
    sessionId: 'test-session',
    messageId,
    timestamp: new Date().toISOString(),
    ...extra,
  } as StreamEvent;
}

/**
 * Create a stream event with a specific ID (for duplication testing).
 *
 * @param id - Explicit event ID
 * @param type - Event type
 * @param messageId - Message ID for the event
 * @param extra - Additional event-specific properties
 * @returns Complete StreamEvent
 */
export function createEventWithId<T extends StreamEvent['type']>(
  id: string,
  type: T,
  messageId: string,
  extra: Omit<
    Extract<StreamEvent, { type: T }>,
    'id' | 'type' | 'sessionId' | 'messageId' | 'timestamp'
  >
): StreamEvent {
  return {
    id,
    type,
    sessionId: 'test-session',
    messageId,
    timestamp: new Date().toISOString(),
    ...extra,
  } as StreamEvent;
}
