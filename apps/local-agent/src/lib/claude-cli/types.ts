// CLI NDJSON event types from `claude -p --output-format stream-json`

/**
 * System event emitted at the start of a session.
 */
export interface CliSystemEvent {
  type: 'system';
  subtype: 'init' | string;
  session_id?: string;
  tools?: Array<{ name: string; description?: string }>;
}

/**
 * Content block types within assistant messages.
 */
export interface CliTextBlock {
  type: 'text';
  text: string;
}

export interface CliThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface CliToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input?: unknown;
}

export type CliContentBlock = CliTextBlock | CliThinkingBlock | CliToolUseBlock;

/**
 * Assistant event containing Claude's response content.
 */
export interface CliAssistantEvent {
  type: 'assistant';
  message: {
    content: CliContentBlock[];
  };
}

/**
 * Tool result content block within user messages.
 */
export interface CliToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: unknown;
  is_error?: boolean;
}

/**
 * User event containing tool results.
 */
export interface CliUserEvent {
  type: 'user';
  message: {
    content: CliToolResultBlock[];
  };
}

/**
 * Result event emitted at the end of a session.
 */
export interface CliResultEvent {
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_execution' | string;
  session_id?: string;
  cost_usd?: number;
  is_error?: boolean;
  duration_ms?: number;
  duration_api_ms?: number;
  num_turns?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  errors?: string[];
}

/**
 * Stream event delta types for partial messages.
 */
export interface CliTextDelta {
  type: 'text_delta';
  text: string;
}

export interface CliThinkingDelta {
  type: 'thinking_delta';
  thinking: string;
}

export interface CliInputJsonDelta {
  type: 'input_json_delta';
  partial_json: string;
}

export type CliStreamDelta =
  | CliTextDelta
  | CliThinkingDelta
  | CliInputJsonDelta;

/**
 * Content block for stream_event content_block_start.
 */
export interface CliStreamContentBlock {
  type: 'text' | 'thinking' | 'tool_use';
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

/**
 * Stream event emitted with --include-partial-messages flag.
 * Contains real-time streaming events from the API.
 */
export interface CliStreamEvent {
  type: 'stream_event';
  event: {
    type:
      | 'message_start'
      | 'content_block_start'
      | 'content_block_delta'
      | 'content_block_stop'
      | 'message_delta'
      | 'message_stop';
    index?: number;
    delta?: CliStreamDelta;
    content_block?: CliStreamContentBlock;
    message?: unknown;
  };
  session_id?: string;
}

/**
 * Union of all CLI event types.
 */
export type CliEvent =
  | CliSystemEvent
  | CliAssistantEvent
  | CliUserEvent
  | CliResultEvent
  | CliStreamEvent;

/**
 * Internal event type for session ID capture.
 * Not emitted externally, used internally by the mapper.
 */
export interface InternalSessionIdEvent {
  type: '_internal_session_id';
  cliSessionId: string;
}
