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

// Message type for conversation history
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
      usage?: { promptTokens: number; completionTokens: number };
      finishReason?: string;
    }
  | { type: 'error'; error: AgentError };
