/**
 * Shared domain types for the agents feature.
 * Input/result types for individual handlers are co-located with their handlers.
 */

import type { ThinkingConfig } from '../../db/schema/agents';

// Re-export for convenience
export type { ThinkingConfig };

/**
 * External agent - WebSocket-based agent that connects from external process
 */
export interface ExternalAgentListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  secretKeyPrefix: string;
  disabled: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Server agent - LLM agent that runs on the server
 */
export interface ServerAgentListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  provider: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  temperature: number | null;
  maxOutputTokens: number | null;
  thinkingConfig: ThinkingConfig | null;
  disabled: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined response for endpoints that return both agent types
 */
export interface AgentsListResponse {
  external: ExternalAgentListItem[];
  server: ServerAgentListItem[];
}

/**
 * Union type for when we need to work with either agent type
 */
export type AnyAgentListItem =
  | (ExternalAgentListItem & { type: 'external' })
  | (ServerAgentListItem & { type: 'server' });

// Legacy type - agent definition (for in-memory agent registry)
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: string[];
  releasedAt: Date;
  /** Timeout in milliseconds for spawned agent responses (default: 900000 / 15 minutes) */
  spawnTimeout?: number;
}
