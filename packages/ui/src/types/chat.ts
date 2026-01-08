import type { ReactNode } from 'react';

// Message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// AI Provider types
export type AIProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'cohere'
  | 'meta'
  | 'unknown';

// Task status states
export type TaskStatus =
  | 'ready'
  | 'submitted'
  | 'streaming'
  | 'error'
  | 'loading';

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
  durationSeconds?: number;
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
export interface TaskMessage {
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
  provider: AIProvider;
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

// Token breakdown for context visualization
export interface TokenBreakdown {
  systemPrompt: number;
  toolDefinitions: number;
  conversationHistory: number;
  toolResults: number;
  userInput: number;
  completion?: number;
}

// Context usage
export interface ContextUsage {
  used: number; // Current context window usage (not accumulated total)
  total: number; // Context window limit
  percentage: number;
  promptTokens?: number; // Accumulated prompt tokens (for billing)
  completionTokens?: number; // Accumulated completion tokens (for billing)
  estimatedCost?: number;
  cacheReadTokens?: number; // Accumulated cache read tokens
  cacheWriteTokens?: number; // Accumulated cache write tokens
  tokenBreakdown?: TokenBreakdown; // Breakdown of context by category
}

// Suggestion chip for empty state
export interface SuggestionChip {
  id: string;
  text: string;
  prompt?: string;
}

// User info for task history
export interface TaskHistoryUser {
  id: string;
  name: string;
  avatarColor?: string;
  avatarUrl?: string;
}

// Task history item for sidebar
export interface TaskHistoryItem {
  id: string;
  title: string;
  description?: string;
  preview?: string;
  createdAt: Date;
  updatedAt?: Date;
  isPrivate?: boolean;
  user?: TaskHistoryUser;
  agentName?: string;
  totalTokens?: number;
  messageCount?: number;
  isStreaming?: boolean;
  /** Whether this session was spawned by another agent (has parent) */
  isSubAgent?: boolean;
}

// Agent type for selection
export interface AgentType {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  tools?: string[];
  model?: string;
  provider?: string;
  isLocal?: boolean;
  disabled?: boolean;
  isFavorite?: boolean;
}

// Todo item types for TodoWrite tool visualization
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
  content: string;
  status: TodoStatus;
  activeForm: string;
}
