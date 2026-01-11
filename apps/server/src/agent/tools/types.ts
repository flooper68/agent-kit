import type { AgentSpawner } from '../agent-spawner';
import type { ToolCategory } from '@agent-kit/shared';
import type { ActionsContext } from '../actions/types';

// Re-export ActionsContext for convenience
export type { ActionsContext };

/**
 * Context required for tools (extends ActionsContext with tool-specific dependencies)
 */
export interface ToolsContext extends ActionsContext {
  /** Key of the current agent (for spawn validation) */
  parentAgentKey?: string;

  /** Agent spawner for spawnAgent tool */
  agentSpawner: AgentSpawner;

  /** Current spawn depth for recursion tracking (0 for root sessions) */
  currentSpawnDepth: number;
}

/**
 * Backward-compatible alias for ToolsContext
 * @deprecated Use ToolsContext instead
 */
export type ToolContext = ToolsContext;

/**
 * Tool metadata for UI display
 */
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
}
