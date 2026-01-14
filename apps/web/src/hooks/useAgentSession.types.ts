/**
 * Type definitions for useAgentSession hook dependencies.
 * Enables dependency injection for testing.
 */

// Session query result type (matches server response from sessions.get)
export interface SessionData {
  id: string;
  agentId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    createdAt: string;
    status?: 'pending' | 'streaming' | 'complete' | 'error' | 'interrupted' | 'awaiting_approval';
    parts: Array<{
      type: string;
      content?: string;
      toolCallId?: string;
      toolName?: string;
      args?: Record<string, unknown>;
      state?: string;
      result?: unknown;
      isError?: boolean;
    }>;
  }>;
  lastStreamId?: string;
  isStreaming: boolean;
  /** Max context tokens for this session's agent (from agent config or model default) */
  maxContextTokens?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

// Base stream event with common fields
interface BaseStreamEvent {
  id: string;
  type: string;
  sessionId: string;
  messageId: string;
  timestamp: string;
}

export interface UserMessageCreatedEvent extends BaseStreamEvent {
  type: 'user_message_created';
  content: string;
}

export interface MessageStartEvent extends BaseStreamEvent {
  type: 'message_start';
}

export interface TextDeltaEvent extends BaseStreamEvent {
  type: 'text_delta';
  delta: string;
}

export interface ReasoningDeltaEvent extends BaseStreamEvent {
  type: 'reasoning_delta';
  delta: string;
}

export interface ToolCallStartEvent extends BaseStreamEvent {
  type: 'tool_call_start';
  toolCallId: string;
  toolName: string;
  toolArgs?: Record<string, unknown>;
}

export interface ToolResultEvent extends BaseStreamEvent {
  type: 'tool_result';
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

export interface MessageCompleteEvent extends BaseStreamEvent {
  type: 'message_complete';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    estimatedCost?: number;
  };
}

export interface ErrorEvent extends BaseStreamEvent {
  type: 'error';
  error: string;
  code?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export interface InterruptedEvent extends BaseStreamEvent {
  type: 'interrupted';
}

export interface ClientToolRequestEvent extends BaseStreamEvent {
  type: 'client_tool_request';
  toolName: string;
  requestId: string;
  params: Record<string, unknown>;
  requiresResponse: boolean;
}

export interface SpawnSessionCreatedEvent extends BaseStreamEvent {
  type: 'spawn_session_created';
  toolCallId: string;
  spawnedSessionId: string;
}

export interface ToolApprovalRequestedEvent extends BaseStreamEvent {
  type: 'tool_approval_requested';
  approvalId: string;
  toolCallId: string;
  toolName: string;
  toolArgs?: Record<string, unknown>;
  requiredScopes?: string[];
}

export interface ToolApprovalRespondedEvent extends BaseStreamEvent {
  type: 'tool_approval_responded';
  approvalId: string;
  approved: boolean;
  denialReason?: string;
  approvedByUserId?: string;
  approvedAt?: string; // ISO string
}

export type StreamEvent =
  | UserMessageCreatedEvent
  | MessageStartEvent
  | TextDeltaEvent
  | ReasoningDeltaEvent
  | ToolCallStartEvent
  | ToolResultEvent
  | MessageCompleteEvent
  | ErrorEvent
  | InterruptedEvent
  | ClientToolRequestEvent
  | SpawnSessionCreatedEvent
  | ToolApprovalRequestedEvent
  | ToolApprovalRespondedEvent;

// Query result interface
export interface SessionQueryResult {
  data: SessionData | undefined;
  isSuccess: boolean;
  isError: boolean;
}

// Subscription result interface
export interface SubscriptionResult {
  status: 'idle' | 'connecting' | 'pending' | 'error';
  error: { message: string } | null;
}

// Dependencies interface for injection
export interface AgentSessionDependencies {
  useSessionQuery: (sessionId: string | null) => SessionQueryResult;
  useMessageSubscription: (
    input: { sessionId: string; lastEventId?: string; replayHistory?: boolean },
    options: {
      enabled: boolean;
      onData: (event: StreamEvent) => void;
      onError: (error: { message: string }) => void;
    }
  ) => SubscriptionResult;
  useSendMutation: () => {
    mutateAsync: (input: {
      sessionId: string;
      content: string;
    }) => Promise<{ sessionId: string }>;
  };
  useInterruptMutation: () => {
    mutateAsync: (input: {
      sessionId: string;
    }) => Promise<{ success: boolean }>;
  };
  getConnectionState: () => { reconnectAttempts: number };
}
