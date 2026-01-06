import { z } from 'zod';

// ============= Server → Agent Messages =============

// Session message schema (minimal message info)
export const SessionMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  status: z.enum(['pending', 'streaming', 'complete', 'error', 'interrupted']),
  createdAt: z.string(),
});

export type SessionMessage = z.infer<typeof SessionMessageSchema>;

// Session event schema (raw event data from DB)
export const SessionEventSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  sequence: z.number(),
  type: z.enum([
    'text_delta',
    'reasoning_delta',
    'tool_call',
    'tool_result',
    'error',
    'unknown',
  ]),
  content: z.string().nullish(),
  toolCallId: z.string().nullish(),
  toolName: z.string().nullish(),
  toolArgs: z.record(z.string(), z.unknown()).nullish(),
  toolResult: z.unknown().nullish(),
  isError: z.boolean().nullish(),
  createdAt: z.string(),
});

export type SessionEvent = z.infer<typeof SessionEventSchema>;

export const UserMessagePayloadSchema = z.object({
  type: z.literal('user_message'),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid(), // Assistant message ID for event association
  userMessageId: z.string().uuid(),
  content: z.string(),
  userId: z.string(),
  timestamp: z.string(),
  messages: z.array(SessionMessageSchema), // Session messages
  events: z.array(SessionEventSchema), // Raw session events
});

export type UserMessagePayload = z.infer<typeof UserMessagePayloadSchema>;

export const InterruptPayloadSchema = z.object({
  type: z.literal('interrupt'),
  sessionId: z.string().uuid(),
  timestamp: z.string(),
});

export type InterruptPayload = z.infer<typeof InterruptPayloadSchema>;

export const ServerToAgentMessageSchema = z.discriminatedUnion('type', [
  UserMessagePayloadSchema,
  InterruptPayloadSchema,
]);

export type ServerToAgentMessage = z.infer<typeof ServerToAgentMessageSchema>;

// ============= Agent → Server Messages =============

// Event types matching server's StreamEvent types
export const StreamEventTypeSchema = z.enum([
  'message_start',
  'text_delta',
  'reasoning_delta',
  'tool_call_start',
  'tool_call_args_delta',
  'tool_result',
  'message_complete',
  'error',
  'interrupted',
]);

export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;

// Individual event schemas (subset needed for local agent)
export const MessageStartEventSchema = z.object({
  type: z.literal('message_start'),
});

export const TextDeltaEventSchema = z.object({
  type: z.literal('text_delta'),
  delta: z.string(),
});

export const ReasoningDeltaEventSchema = z.object({
  type: z.literal('reasoning_delta'),
  delta: z.string(),
});

export const ToolCallStartEventSchema = z.object({
  type: z.literal('tool_call_start'),
  toolCallId: z.string(),
  toolName: z.string(),
  toolArgs: z.record(z.string(), z.unknown()).optional(),
});

export const ToolCallArgsDeltaEventSchema = z.object({
  type: z.literal('tool_call_args_delta'),
  toolCallId: z.string(),
  delta: z.string(),
});

export const ToolResultEventSchema = z.object({
  type: z.literal('tool_result'),
  toolCallId: z.string(),
  result: z.unknown(),
  isError: z.boolean().optional(),
});

export const MessageCompleteEventSchema = z.object({
  type: z.literal('message_complete'),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      estimatedCost: z.number().optional(),
    })
    .optional(),
  finishReason: z.string().optional(),
});

export const ErrorEventSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
  code: z.string().optional(),
  retryable: z.boolean().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const InterruptedEventSchema = z.object({
  type: z.literal('interrupted'),
});

export const StreamEventSchema = z.discriminatedUnion('type', [
  MessageStartEventSchema,
  TextDeltaEventSchema,
  ReasoningDeltaEventSchema,
  ToolCallStartEventSchema,
  ToolCallArgsDeltaEventSchema,
  ToolResultEventSchema,
  MessageCompleteEventSchema,
  ErrorEventSchema,
  InterruptedEventSchema,
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;

// Event payload sent to server
export const EventPayloadSchema = z.object({
  type: z.literal('event'),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid(),
  event: StreamEventSchema,
});

export type EventPayload = z.infer<typeof EventPayloadSchema>;

// Agent to server message types
export const AgentToServerMessageSchema = z.discriminatedUnion('type', [
  EventPayloadSchema,
]);

export type AgentToServerMessage = z.infer<typeof AgentToServerMessageSchema>;

// ============= Agent Handler Interface =============

/**
 * Configuration for agent handlers.
 */
export interface AgentHandlerConfig {
  /** Working directory for file operations */
  cwd: string;
  /** List of tools the handler is allowed to use */
  allowedTools: string[];
}

/**
 * Extended configuration for Claude Code SDK handlers.
 */
export interface ClaudeCodeHandlerConfig extends AgentHandlerConfig {
  /** Claude model to use (e.g., 'claude-sonnet-4-20250514', 'claude-opus-4-20250514') */
  model?: string;
  /** Maximum tokens for extended thinking mode (enables thinking when set) */
  maxThinkingTokens?: number;
  /** Enable partial message streaming for better real-time updates */
  includePartialMessages?: boolean;
  /** Error code prefix for this handler (e.g., 'CODEBASE_RESEARCHER') */
  errorCodePrefix?: string;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Tools to block */
  disallowedTools?: string[];
  /** Custom system prompt to append */
  appendSystemPrompt?: string;
  /** Permission handling mode (for Claude CLI) */
  permissionMode?: 'dangerously-skip-permissions' | 'allowed-tools';
}

/**
 * Parameters for running the agent.
 */
export interface AgentRunParams {
  /** Session identifier */
  sessionId: string;
  /** Message identifier for event association */
  messageId: string;
  /** User prompt content */
  content: string;
  /** Session messages (basic info) */
  messages: SessionMessage[];
  /** Raw session events */
  events: SessionEvent[];
  /** Abort signal for cancellation */
  abortSignal: AbortSignal;
}

/**
 * Usage statistics returned after completion.
 */
export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  estimatedCost?: number;
}

/**
 * Result of agent execution.
 */
export interface AgentRunResult {
  usage?: AgentUsage;
}

/**
 * Abstract interface for agent handlers.
 * Implementations wrap specific AI SDKs and emit provider-agnostic StreamEvents.
 */
export interface AgentHandler {
  /** Handler identifier (e.g., 'claude-code', 'openai') */
  readonly id: string;

  /**
   * Execute the agent with the given prompt.
   * Yields StreamEvent objects as the agent processes.
   *
   * @param params - Run parameters including prompt and abort signal
   * @returns Async generator yielding StreamEvents, with final result containing usage
   */
  run(
    params: AgentRunParams
  ): AsyncGenerator<StreamEvent, AgentRunResult, undefined>;
}

// ============= Active Session Tracking =============

export interface ActiveSession {
  sessionId: string;
  messageId: string;
  abortController: AbortController;
}
