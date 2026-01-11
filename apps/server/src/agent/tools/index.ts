/**
 * Tool system entry point
 *
 * Re-exports from:
 * - types.ts: Shared types (ToolContext, ToolMetadata)
 * - tools.ts: Tools (spawnAgent, listSkillFiles, readSkillFile, executeCommand)
 * - actions.ts: Actions (all other operations)
 */

import type { ToolCategory } from '@agent-kit/shared';

// Re-export types
export type { ToolContext, ToolMetadata } from './types';
export type { ToolCategory };

// Re-export from tools.ts
export {
  TOOL_IDS,
  getToolsById,
  listToolIds,
  getToolsMetadata,
  getToolMetadata,
} from './tools';
export type { ToolId } from './tools';

// Re-export from actions.ts
export {
  STATIC_ACTIONS,
  ACTION_IDS,
  getActionsById,
  listActionIds,
} from './actions';
export type { StaticActionId, ContextActionId, ActionId } from './actions';
