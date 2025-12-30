// Message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// Chat status states
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

// Message part types (following AI SDK patterns)
export type MessagePartType =
  | 'text'
  | 'tool_invocation'
  | 'tool_result'
  | 'reasoning'
  | 'image'
  | 'file';

// Base message part
export interface BaseMessagePart {
  type: MessagePartType;
  id: string;
}

// Text content part
export interface TextPart extends BaseMessagePart {
  type: 'text';
  content: string;
}

// Tool invocation part
export interface ToolInvocationPart extends BaseMessagePart {
  type: 'tool_invocation';
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
  state: 'pending' | 'running' | 'completed' | 'error';
}

// Tool result part
export interface ToolResultPart extends BaseMessagePart {
  type: 'tool_result';
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

// Reasoning/thinking part
export interface ReasoningPart extends BaseMessagePart {
  type: 'reasoning';
  content: string;
  isCollapsed?: boolean;
}

// Image attachment
export interface ImagePart extends BaseMessagePart {
  type: 'image';
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// File attachment
export interface FilePart extends BaseMessagePart {
  type: 'file';
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

// Union type for all parts
export type MessagePart =
  | TextPart
  | ToolInvocationPart
  | ToolResultPart
  | ReasoningPart
  | ImagePart
  | FilePart;

// Main message interface
export interface ChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  createdAt: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    latency?: number;
  };
}

// Attachment for input
export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
  mimeType: string;
  size: number;
  preview?: string;
}

// Model option
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextWindow?: number;
  maxOutput?: number;
}

// Thinking status
export interface ThinkingStatus {
  isThinking: boolean;
  status?: string;
  detail?: string;
}

// Context usage
export interface ContextUsage {
  used: number;
  total: number;
  percentage: number;
}

// Suggestion chip for empty state
export interface SuggestionChip {
  id: string;
  text: string;
  prompt?: string;
}

// Chat history item for sidebar
export interface ChatHistoryItem {
  id: string;
  title: string;
  preview?: string;
  createdAt: Date;
  updatedAt?: Date;
}
