// ============= SDK Message Types =============
// Types for Claude Code SDK messages

export interface SDKSystemMessage {
  type: 'system';
  subtype: 'init' | string;
  session_id?: string;
  [key: string]: unknown;
}

export type UserMessageContent = string | UserMessageContentBlock[];

export interface UserMessageContentBlock {
  type: string;
  text?: string;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

export interface SDKUserMessage {
  type: 'user';
  message?: {
    content: UserMessageContent;
  };
  [key: string]: unknown;
}

export interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

export interface SDKAssistantMessage {
  type: 'assistant';
  message: {
    content: ContentBlock[];
  };
  [key: string]: unknown;
}

export interface SDKResultMessage {
  type: 'result';
  subtype: 'success' | 'error' | string;
  result?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    /** Cache read tokens (prompt cache hits) */
    cache_read_input_tokens?: number;
    /** Cache write tokens (prompt cache creation) */
    cache_creation_input_tokens?: number;
  };
  total_cost_usd?: number;
  errors?: string[];
  [key: string]: unknown;
}

// ============= Stream Event Types =============
// Types for real-time streaming events from the Anthropic API
// These are yielded when includePartialMessages: true

export interface TextDelta {
  type: 'text_delta';
  text: string;
}

export interface ThinkingDelta {
  type: 'thinking_delta';
  thinking: string;
}

export interface InputJsonDelta {
  type: 'input_json_delta';
  partial_json: string;
}

export type ContentBlockDeltaPayload =
  | TextDelta
  | ThinkingDelta
  | InputJsonDelta;

export interface ContentBlockDelta {
  type: 'content_block_delta';
  index: number;
  delta: ContentBlockDeltaPayload;
}

export interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface TextContentBlock {
  type: 'text';
  text: string;
}

export interface ThinkingContentBlock {
  type: 'thinking';
  thinking: string;
}

export type ContentBlockPayload =
  | ToolUseContentBlock
  | TextContentBlock
  | ThinkingContentBlock;

export interface ContentBlockStart {
  type: 'content_block_start';
  index: number;
  content_block: ContentBlockPayload;
}

export interface ContentBlockStop {
  type: 'content_block_stop';
  index: number;
}

export interface MessageStart {
  type: 'message_start';
}

export interface MessageDelta {
  type: 'message_delta';
}

export interface MessageStop {
  type: 'message_stop';
}

export type RawMessageStreamEvent =
  | ContentBlockDelta
  | ContentBlockStart
  | ContentBlockStop
  | MessageStart
  | MessageDelta
  | MessageStop;

export interface SDKStreamEventMessage {
  type: 'stream_event';
  event: RawMessageStreamEvent;
  parent_tool_use_id: string | null;
  [key: string]: unknown;
}

export type SDKMessage =
  | SDKSystemMessage
  | SDKUserMessage
  | SDKAssistantMessage
  | SDKResultMessage
  | SDKStreamEventMessage;
