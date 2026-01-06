import type { AgentError } from './errors';

// Agent definition stored in the registry
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: string[];
}

// Message types compatible with AI SDK's streamText() function
// These match the structure expected by the AI SDK without direct imports

export type TextContentPart = { type: 'text'; text: string };
export type ToolCallContentPart = {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
};
// AI SDK v6 ToolResultOutput format - must have type discriminator
export type ToolResultOutput =
  | { type: 'text'; value: string }
  | { type: 'json'; value: unknown }
  | { type: 'error-text'; value: string }
  | { type: 'error-json'; value: unknown }
  | { type: 'content'; value: Array<{ type: 'text'; text: string }> };

export type ToolResultContentPart = {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  output: ToolResultOutput;
};

export type AssistantContentPart =
  | TextContentPart
  | ToolCallContentPart
  | ToolResultContentPart;

// Message type for conversation history (structurally compatible with AI SDK)
export type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | AssistantContentPart[] }
  | { role: 'system'; content: string };

// Tool type - using unknown to allow any tool shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tool = any;

// Provider abstraction for different LLM providers
export interface AgentProvider {
  id: string;
  createStream(config: StreamConfig): AsyncIterable<ProviderStreamEvent>;
}

export interface StreamConfig {
  model: string;
  systemPrompt: string;
  messages: Message[];
  tools: Record<string, Tool>;
  abortSignal?: AbortSignal;
}

// Events emitted by the provider during streaming
export type ProviderStreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'reasoning_delta'; content: string }
  | {
      type: 'tool_call';
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
    }
  | {
      type: 'tool_result';
      toolCallId: string;
      result: unknown;
      isError?: boolean;
    }
  | {
      type: 'done';
      text: string;
      usage?: {
        promptTokens: number;
        completionTokens: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
      };
      finishReason?: string;
    }
  | { type: 'error'; error: AgentError };
