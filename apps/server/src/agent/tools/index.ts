/**
 * Basic Tools - exposed directly to agents as MCP tools
 *
 * This module contains the basic tools that are directly accessible
 * to agents: spawnAgent, listSkillFiles, readSkillFile, executeCommand.
 *
 * For actions (callable via executeCommand), see ../actions/index.ts
 */

import type { Tool } from '../shared/types';
import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentsFeature } from '../../features/agents';
import type { SkillsFeature } from '../../features/skills';
import type { EventStreamManager } from '../shared/event-stream-manager';
import type { PubSubManager } from '../../real-time';
import type { AgentSpawner } from '../shared/spawner';
import { logger } from '../shared/logger';
import {
  SERVER_TOOL_DEFINITIONS,
  type ToolCategory,
  type ActionCategory,
} from '@agent-kit/shared';
import { createSpawnAgentTool } from './spawn-agent';
import { createListSkillFilesTool } from './list-skill-files';
import { createReadSkillFileTool } from './read-skill-file';
import { createExecuteCommandTool } from './execute-command';

// Basic tool IDs (exposed directly to agents as MCP tools)
const BASIC_TOOL_IDS = [
  'spawnAgent',
  'listSkillFiles',
  'readSkillFile',
  'executeCommand',
] as const;

export type BasicToolId = (typeof BASIC_TOOL_IDS)[number];

/**
 * Context required for context-aware tools
 */
export interface ToolContext {
  // Core identifiers - always required
  userId: string;
  orgId: string;
  sessionId: string;
  messageId: string;

  // Agent context - optional, not all contexts have an agent
  agentId?: string;
  /** Key of the current agent (for spawn validation) */
  parentAgentKey?: string;

  // Core features - always required
  artifactsFeature: ArtifactsFeature;
  /** Agents feature for agent management tools */
  agentsFeature: AgentsFeature;
  /** Skills feature for skill tools */
  skillsFeature: SkillsFeature;
  /** Event stream manager for client-side tools */
  eventStreamManager: EventStreamManager;
  /** Pub/Sub manager for stateful client-side tools */
  pubsub: PubSubManager;
  /** Agent spawner for spawnAgent tool */
  agentSpawner: AgentSpawner;

  // Feature-flagged - remain optional
  projectsFeature?: ProjectsFeature;
  tasksFeature?: TasksFeature;

  // Spawn context - required (callers set defaults)
  /** Current spawn depth for recursion tracking (0 for root sessions) */
  currentSpawnDepth: number;
  /** Allowed skill IDs for this agent (empty array = no skills allowed) */
  allowedSkillIds: string[];
  /** Allowed tool IDs for this agent (used by executeCommand for access control) */
  allowedToolIds: string[];
}

/**
 * Get basic tools by their IDs (spawnAgent, listSkillFiles, readSkillFile, executeCommand)
 * These are the only tools directly exposed to agents as MCP tools.
 */
export function getToolsById(
  ids: string[],
  context: ToolContext
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
      default:
        logger.warn('Unknown basic tool requested', { toolId: id });
    }
  }

  return result;
}

/**
 * List all basic tool IDs
 */
export function listToolIds(): string[] {
  return [...BASIC_TOOL_IDS];
}

// Re-export ToolCategory from shared
export type { ToolCategory };

/**
 * Tool metadata for UI display
 */
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory | ActionCategory;
}

/**
 * Convert camelCase tool ID to Title Case display name
 */
function formatToolName(id: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    getCurrentUIState: 'Get UI State',
    setAgentEnabled: 'Enable/Disable Agent',
  };

  if (specialCases[id]) {
    return specialCases[id];
  }

  // Convert camelCase to Title Case with spaces
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get shortened description for UI display (first sentence only)
 */
function getShortDescription(description: string): string {
  // Take first sentence or first line
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
 * Get metadata for all available tools
 */
export function getToolsMetadata(): ToolMetadata[] {
  return listToolIds().map(
    (id) =>
      TOOL_METADATA[id] ?? {
        id,
        name: id,
        description: 'No description available',
        category: 'utility' as ActionCategory,
      }
  );
}

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(id: string): ToolMetadata | undefined {
  return TOOL_METADATA[id];
}
