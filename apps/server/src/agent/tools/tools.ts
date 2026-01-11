/**
 * Tools - fundamental tools for agent operation
 *
 * These are the core tools that agents use for basic functionality:
 * - spawnAgent: Spawn sub-agents
 * - listSkillFiles: List files in a skill
 * - readSkillFile: Read a skill file
 * - executeCommand: Execute actions via CLI syntax
 */

import type { Tool } from '../types';
import type { ToolsContext, ToolMetadata } from './types';
import { SERVER_TOOL_DEFINITIONS, type ToolCategory } from '@agent-kit/shared';
import { createSpawnAgentTool } from './spawn-agent';
import { createListSkillFilesTool } from './list-skill-files';
import { createReadSkillFileTool } from './read-skill-file';
import { createExecuteCommandTool } from './execute-command';

/**
 * Tool IDs (category: 'basic' in UI)
 */
export const TOOL_IDS = [
  'spawnAgent',
  'listSkillFiles',
  'readSkillFile',
  'executeCommand',
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

/**
 * Get tools by their IDs
 * All tools require context
 */
export function getToolsById(
  ids: string[],
  context: ToolsContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};

  for (const id of ids) {
    switch (id) {
      case 'spawnAgent':
        result[id] = createSpawnAgentTool({
          userId: context.userId,
          orgId: context.orgId,
          sessionId: context.sessionId,
          currentSpawnDepth: context.currentSpawnDepth,
          agentSpawner: context.agentSpawner,
          messageId: context.messageId,
          parentAgentKey: context.parentAgentKey,
        });
        break;
      case 'listSkillFiles':
        result[id] = createListSkillFilesTool({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
          allowedSkillIds: context.allowedSkillIds,
        });
        break;
      case 'readSkillFile':
        result[id] = createReadSkillFileTool({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
          allowedSkillIds: context.allowedSkillIds,
        });
        break;
      case 'executeCommand':
        result[id] = createExecuteCommandTool({
          toolContext: context,
        });
        break;
    }
  }

  return result;
}

/**
 * List tool IDs
 */
export function listToolIds(): string[] {
  return [...TOOL_IDS];
}

/**
 * Convert camelCase tool ID to Title Case display name
 */
function formatToolName(id: string): string {
  const specialCases: Record<string, string> = {
    getCurrentUIState: 'Get UI State',
    setAgentEnabled: 'Enable/Disable Agent',
  };

  if (specialCases[id]) {
    return specialCases[id];
  }

  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get shortened description for UI display (first sentence only)
 */
function getShortDescription(description: string): string {
  const firstSentence = description.split(/[.\n]/)[0];
  return firstSentence?.trim() ?? description;
}

/**
 * Tool metadata derived from shared definitions (single source of truth)
 */
const TOOL_METADATA: Record<string, ToolMetadata> = Object.fromEntries(
  Object.entries(SERVER_TOOL_DEFINITIONS).map(([id, def]) => [
    id,
    {
      id,
      name: formatToolName(id),
      description: getShortDescription(def.description),
      category: def.category,
    },
  ])
);

/**
 * Get metadata for all tools (filtered to 'basic' category for UI)
 */
export function getToolsMetadata(): ToolMetadata[] {
  return listToolIds()
    .map(
      (id) =>
        TOOL_METADATA[id] ?? {
          id,
          name: id,
          description: 'No description available',
          category: 'utility' as ToolCategory,
        }
    )
    .filter((tool) => tool.category === 'basic');
}

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(id: string): ToolMetadata | undefined {
  return TOOL_METADATA[id];
}
