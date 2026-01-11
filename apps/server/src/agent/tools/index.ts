import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentsFeature } from '../../features/agents';
import type { SkillsFeature } from '../../features/skills';
import type { EventStreamManager } from '../event-stream-manager';
import type { PubSubManager } from '../../real-time';
import type { AgentSpawner } from '../agent-spawner';
import { logger } from '../logger';
import { SERVER_TOOL_DEFINITIONS, type ToolCategory } from '@agent-kit/shared';
import { getTimeTool } from './get-time';
import { webSearchTool } from './web-search';
import { extractContentTool } from './extract-content';
import { fetchTool } from './fetch';
import { createWriteArtifactTool } from './write-artifact';
import { createSearchArtifactsTool } from './search-artifacts';
import { createReadArtifactTool } from './read-artifact';
import { createUpdateArtifactTool } from './update-artifact';
import { createListProjectsTool } from './list-projects';
import { createSearchProjectsTool } from './search-projects';
import { createGetProjectTool } from './get-project';
import { createCreateProjectTool } from './create-project';
import { createUpdateProjectTool } from './update-project';
import { createDeleteProjectTool } from './delete-project';
import { createListTasksTool } from './list-tasks';
import { createSearchTasksTool } from './search-tasks';
import { createGetTaskTool } from './get-task';
import { createCreateTaskTool } from './create-task';
import { createUpdateTaskTool } from './update-task';
import { createMoveTaskTool } from './move-task';
import { createReorderTaskTool } from './reorder-task';
import { createAttachArtifactToTaskTool } from './attach-artifact-to-task';
import { createDetachArtifactFromTaskTool } from './detach-artifact-from-task';
import { createDeleteTaskTool } from './delete-task';
import {
  createNavigateToTool,
  createGetCurrentUIStateTool,
} from './client-tools';
import { createSpawnAgentTool } from './spawn-agent';
import { createListAgentsTool } from './list-agents';
import { createGetAgentTool } from './get-agent';
import { createUpdateAgentTool } from './update-agent';
import { createSetAgentEnabledTool } from './set-agent-enabled';
import { createToggleAgentFavoriteTool } from './toggle-agent-favorite';
import { createListSkillFilesTool } from './list-skill-files';
import { createReadSkillFileTool } from './read-skill-file';
import { createExecuteCommandTool } from './execute-command';
import { createCreateSkillTool } from './create-skill';
import { createUpdateSkillTool } from './update-skill';
import { createDeleteSkillTool } from './delete-skill';
import { createListSkillsTool } from './list-skills';
import { createGetSkillTool } from './get-skill';

// Static tools (no context needed)
const STATIC_TOOLS: Record<string, Tool> = {
  getTime: getTimeTool,
  webSearch: webSearchTool,
  extractContent: extractContentTool,
  fetch: fetchTool,
};

// Context-aware tool IDs
const CONTEXT_TOOL_IDS = [
  // Artifact tools
  'writeArtifact',
  'searchArtifacts',
  'readArtifact',
  'updateArtifact',
  // Project tools
  'listProjects',
  'searchProjects',
  'getProject',
  'createProject',
  'updateProject',
  'deleteProject',
  // Task tools
  'listTasks',
  'searchTasks',
  'getTask',
  'createTask',
  'updateTask',
  'deleteTask',
  'moveTask',
  'reorderTask',
  'attachArtifactToTask',
  'detachArtifactFromTask',
  // Client-side tools
  'navigateTo',
  'getCurrentUIState',
  // Agent tools
  'spawnAgent',
  'listAgents',
  'getAgent',
  'updateAgent',
  'setAgentEnabled',
  'toggleAgentFavorite',
  // Skill tools
  'listSkills',
  'getSkill',
  'listSkillFiles',
  'readSkillFile',
  'executeCommand',
  'createSkill',
  'updateSkill',
  'deleteSkill',
] as const;

export type StaticToolId = keyof typeof STATIC_TOOLS;
export type ContextToolId = (typeof CONTEXT_TOOL_IDS)[number];
export type ToolId = StaticToolId | ContextToolId;

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
}

/**
 * Get tools by their IDs, creating context-aware tools as needed
 */
export function getToolsById(
  ids: string[],
  context?: ToolContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};

  for (const id of ids) {
    // Check static tools first
    const staticTool = STATIC_TOOLS[id];
    if (staticTool) {
      result[id] = staticTool;
      continue;
    }

    // Create context-aware tools if context is provided
    if (context) {
      switch (id) {
        // Artifact tools
        case 'writeArtifact':
          result[id] = createWriteArtifactTool(context);
          break;
        case 'searchArtifacts':
          result[id] = createSearchArtifactsTool(context);
          break;
        case 'readArtifact':
          result[id] = createReadArtifactTool(context);
          break;
        case 'updateArtifact':
          result[id] = createUpdateArtifactTool(context);
          break;
        // Project tools
        case 'listProjects':
          if (context.projectsFeature) {
            result[id] = createListProjectsTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        case 'searchProjects':
          if (context.projectsFeature) {
            result[id] = createSearchProjectsTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        case 'getProject':
          if (context.projectsFeature) {
            result[id] = createGetProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        case 'createProject':
          if (context.projectsFeature) {
            result[id] = createCreateProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        case 'updateProject':
          if (context.projectsFeature) {
            result[id] = createUpdateProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        case 'deleteProject':
          if (context.projectsFeature) {
            result[id] = createDeleteProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing projectsFeature', {
              tool: id,
            });
          }
          break;
        // Task tools
        case 'listTasks':
          if (context.tasksFeature) {
            result[id] = createListTasksTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'searchTasks':
          if (context.tasksFeature) {
            result[id] = createSearchTasksTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'getTask':
          if (context.tasksFeature) {
            result[id] = createGetTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'createTask':
          if (context.tasksFeature) {
            result[id] = createCreateTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'updateTask':
          if (context.tasksFeature) {
            result[id] = createUpdateTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'deleteTask':
          if (context.tasksFeature) {
            result[id] = createDeleteTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'moveTask':
          if (context.tasksFeature) {
            result[id] = createMoveTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'reorderTask':
          if (context.tasksFeature) {
            result[id] = createReorderTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'attachArtifactToTask':
          if (context.tasksFeature) {
            result[id] = createAttachArtifactToTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        case 'detachArtifactFromTask':
          if (context.tasksFeature) {
            result[id] = createDetachArtifactFromTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing tasksFeature', {
              tool: id,
            });
          }
          break;
        // Client-side tools
        case 'navigateTo':
          // Fire-and-forget tool - doesn't need pubsub
          result[id] = createNavigateToTool({
            sessionId: context.sessionId,
            messageId: context.messageId,
            eventStreamManager: context.eventStreamManager,
          });
          break;
        case 'getCurrentUIState':
          result[id] = createGetCurrentUIStateTool({
            sessionId: context.sessionId,
            messageId: context.messageId,
            eventStreamManager: context.eventStreamManager,
            pubsub: context.pubsub,
          });
          break;
        // Agent spawning tool
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
        // Agent management tools
        case 'listAgents':
          result[id] = createListAgentsTool({
            userId: context.userId,
            agentsFeature: context.agentsFeature,
          });
          break;
        case 'getAgent':
          result[id] = createGetAgentTool({
            userId: context.userId,
            agentsFeature: context.agentsFeature,
          });
          break;
        case 'updateAgent':
          result[id] = createUpdateAgentTool({
            userId: context.userId,
            orgId: context.orgId,
            agentsFeature: context.agentsFeature,
          });
          break;
        case 'setAgentEnabled':
          result[id] = createSetAgentEnabledTool({
            userId: context.userId,
            agentsFeature: context.agentsFeature,
          });
          break;
        case 'toggleAgentFavorite':
          result[id] = createToggleAgentFavoriteTool({
            userId: context.userId,
            agentsFeature: context.agentsFeature,
          });
          break;
        // Skill tools
        case 'listSkills':
          result[id] = createListSkillsTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
          });
          break;
        case 'getSkill':
          result[id] = createGetSkillTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
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
          // executeCommand needs toolContext to call other tools
          result[id] = createExecuteCommandTool({
            toolContext: context,
          });
          break;
        case 'createSkill':
          result[id] = createCreateSkillTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
          });
          break;
        case 'updateSkill':
          result[id] = createUpdateSkillTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
          });
          break;
        case 'deleteSkill':
          result[id] = createDeleteSkillTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
          });
          break;
      }
    }
  }

  return result;
}

/**
 * List all available tool IDs
 */
export function listToolIds(): string[] {
  return [...Object.keys(STATIC_TOOLS), ...CONTEXT_TOOL_IDS];
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
  category: ToolCategory;
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
        category: 'utility' as ToolCategory,
      }
  );
}

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(id: string): ToolMetadata | undefined {
  return TOOL_METADATA[id];
}
