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
import { createGrepSkillsTool } from './grep-skills';
import { createReadSkillFileTool } from './read-skill-file';
import { createExecuteSkillTool } from './execute-skill';
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
  'grepSkills',
  'readSkillFile',
  'executeSkill',
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
  userId: string;
  orgId: string;
  sessionId?: string;
  messageId?: string;
  agentId?: string;
  artifactsFeature: ArtifactsFeature;
  projectsFeature?: ProjectsFeature;
  tasksFeature?: TasksFeature;
  /** Agents feature for agent management tools */
  agentsFeature?: AgentsFeature;
  /** Skills feature for skill tools */
  skillsFeature?: SkillsFeature;
  /** Event stream manager for client-side tools */
  eventStreamManager?: EventStreamManager;
  /** Pub/Sub manager for stateful client-side tools */
  pubsub?: PubSubManager;
  /** Agent spawner for spawnAgent tool */
  agentSpawner?: AgentSpawner;
  /** Current spawn depth for recursion tracking (0 for root sessions) */
  currentSpawnDepth?: number;
  /** Key of the current agent (for spawn validation) */
  parentAgentKey?: string;
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
          if (
            context.eventStreamManager &&
            context.sessionId &&
            context.messageId
          ) {
            result[id] = createNavigateToTool({
              sessionId: context.sessionId,
              messageId: context.messageId,
              eventStreamManager: context.eventStreamManager,
            });
          } else {
            logger.debug('Skipping tool due to missing context', {
              tool: id,
              hasEventStreamManager: !!context.eventStreamManager,
              hasSessionId: !!context.sessionId,
              hasMessageId: !!context.messageId,
            });
          }
          break;
        case 'getCurrentUIState':
          if (
            context.eventStreamManager &&
            context.sessionId &&
            context.messageId &&
            context.pubsub
          ) {
            result[id] = createGetCurrentUIStateTool({
              sessionId: context.sessionId,
              messageId: context.messageId,
              eventStreamManager: context.eventStreamManager,
              pubsub: context.pubsub,
            });
          } else {
            logger.debug('Skipping tool due to missing context', {
              tool: id,
              hasEventStreamManager: !!context.eventStreamManager,
              hasSessionId: !!context.sessionId,
              hasMessageId: !!context.messageId,
              hasPubsub: !!context.pubsub,
            });
          }
          break;
        // Agent spawning tool
        case 'spawnAgent':
          if (context.agentSpawner && context.sessionId && context.messageId) {
            result[id] = createSpawnAgentTool({
              userId: context.userId,
              orgId: context.orgId,
              sessionId: context.sessionId,
              currentSpawnDepth: context.currentSpawnDepth ?? 0,
              agentSpawner: context.agentSpawner,
              messageId: context.messageId,
              parentAgentKey: context.parentAgentKey,
            });
          } else {
            logger.debug('Skipping tool due to missing context', {
              tool: id,
              hasAgentSpawner: !!context.agentSpawner,
              hasSessionId: !!context.sessionId,
              hasMessageId: !!context.messageId,
            });
          }
          break;
        // Agent management tools
        case 'listAgents':
          if (context.agentsFeature) {
            result[id] = createListAgentsTool({
              userId: context.userId,
              agentsFeature: context.agentsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing agentsFeature', {
              tool: id,
            });
          }
          break;
        case 'getAgent':
          if (context.agentsFeature) {
            result[id] = createGetAgentTool({
              userId: context.userId,
              agentsFeature: context.agentsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing agentsFeature', {
              tool: id,
            });
          }
          break;
        case 'updateAgent':
          if (context.agentsFeature) {
            result[id] = createUpdateAgentTool({
              userId: context.userId,
              agentsFeature: context.agentsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing agentsFeature', {
              tool: id,
            });
          }
          break;
        case 'setAgentEnabled':
          if (context.agentsFeature) {
            result[id] = createSetAgentEnabledTool({
              userId: context.userId,
              agentsFeature: context.agentsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing agentsFeature', {
              tool: id,
            });
          }
          break;
        case 'toggleAgentFavorite':
          if (context.agentsFeature) {
            result[id] = createToggleAgentFavoriteTool({
              userId: context.userId,
              agentsFeature: context.agentsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing agentsFeature', {
              tool: id,
            });
          }
          break;
        // Skill tools
        case 'listSkills':
          if (context.skillsFeature) {
            result[id] = createListSkillsTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'getSkill':
          if (context.skillsFeature) {
            result[id] = createGetSkillTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'grepSkills':
          if (context.skillsFeature) {
            result[id] = createGrepSkillsTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'readSkillFile':
          if (context.skillsFeature) {
            result[id] = createReadSkillFileTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'executeSkill':
          // executeSkill needs toolContext to call other tools
          result[id] = createExecuteSkillTool({
            toolContext: context,
          });
          break;
        case 'createSkill':
          if (context.skillsFeature) {
            result[id] = createCreateSkillTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'updateSkill':
          if (context.skillsFeature) {
            result[id] = createUpdateSkillTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
          break;
        case 'deleteSkill':
          if (context.skillsFeature) {
            result[id] = createDeleteSkillTool({
              userId: context.userId,
              orgId: context.orgId,
              skillsFeature: context.skillsFeature,
            });
          } else {
            logger.debug('Skipping tool due to missing skillsFeature', {
              tool: id,
            });
          }
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

/**
 * Tool category for UI grouping
 */
export type ToolCategory =
  | 'utility'
  | 'artifact'
  | 'project'
  | 'task'
  | 'navigation'
  | 'agent'
  | 'skill';

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
 * Tool metadata registry
 */
const TOOL_METADATA: Record<string, ToolMetadata> = {
  // Utility tools
  getTime: {
    id: 'getTime',
    name: 'Get Time',
    description: 'Get the current date and time',
    category: 'utility',
  },
  webSearch: {
    id: 'webSearch',
    name: 'Web Search',
    description: 'Search the web for information',
    category: 'utility',
  },
  extractContent: {
    id: 'extractContent',
    name: 'Extract Content',
    description: 'Extract text content from a URL',
    category: 'utility',
  },
  fetch: {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch raw content from a URL',
    category: 'utility',
  },

  // Artifact tools
  writeArtifact: {
    id: 'writeArtifact',
    name: 'Write Artifact',
    description: 'Save a document or note',
    category: 'artifact',
  },
  searchArtifacts: {
    id: 'searchArtifacts',
    name: 'Search Artifacts',
    description: 'Search for saved documents',
    category: 'artifact',
  },
  readArtifact: {
    id: 'readArtifact',
    name: 'Read Artifact',
    description: 'Read a saved document',
    category: 'artifact',
  },
  updateArtifact: {
    id: 'updateArtifact',
    name: 'Update Artifact',
    description: 'Update an existing document',
    category: 'artifact',
  },

  // Project tools
  listProjects: {
    id: 'listProjects',
    name: 'List Projects',
    description: 'List all projects',
    category: 'project',
  },
  searchProjects: {
    id: 'searchProjects',
    name: 'Search Projects',
    description: 'Search for projects',
    category: 'project',
  },
  getProject: {
    id: 'getProject',
    name: 'Get Project',
    description: 'Get project details',
    category: 'project',
  },
  createProject: {
    id: 'createProject',
    name: 'Create Project',
    description: 'Create a new project',
    category: 'project',
  },
  updateProject: {
    id: 'updateProject',
    name: 'Update Project',
    description: 'Update project details',
    category: 'project',
  },
  deleteProject: {
    id: 'deleteProject',
    name: 'Delete Project',
    description: 'Delete a project',
    category: 'project',
  },

  // Task tools
  listTasks: {
    id: 'listTasks',
    name: 'List Tasks',
    description: 'List tasks in a project',
    category: 'task',
  },
  searchTasks: {
    id: 'searchTasks',
    name: 'Search Tasks',
    description: 'Search for tasks',
    category: 'task',
  },
  getTask: {
    id: 'getTask',
    name: 'Get Task',
    description: 'Get task details',
    category: 'task',
  },
  createTask: {
    id: 'createTask',
    name: 'Create Task',
    description: 'Create a new task',
    category: 'task',
  },
  updateTask: {
    id: 'updateTask',
    name: 'Update Task',
    description: 'Update task details',
    category: 'task',
  },
  deleteTask: {
    id: 'deleteTask',
    name: 'Delete Task',
    description: 'Delete a task',
    category: 'task',
  },
  moveTask: {
    id: 'moveTask',
    name: 'Move Task',
    description: 'Move task to a different status',
    category: 'task',
  },
  reorderTask: {
    id: 'reorderTask',
    name: 'Reorder Task',
    description: 'Change task order in a column',
    category: 'task',
  },
  attachArtifactToTask: {
    id: 'attachArtifactToTask',
    name: 'Attach Artifact',
    description: 'Attach a document to a task',
    category: 'task',
  },
  detachArtifactFromTask: {
    id: 'detachArtifactFromTask',
    name: 'Detach Artifact',
    description: 'Detach a document from a task',
    category: 'task',
  },

  // Navigation tools
  navigateTo: {
    id: 'navigateTo',
    name: 'Navigate To',
    description: 'Navigate the user to a page',
    category: 'navigation',
  },
  getCurrentUIState: {
    id: 'getCurrentUIState',
    name: 'Get UI State',
    description: 'Get current page state',
    category: 'navigation',
  },

  // Agent tools
  spawnAgent: {
    id: 'spawnAgent',
    name: 'Spawn Agent',
    description: 'Delegate a task to another agent',
    category: 'agent',
  },
  listAgents: {
    id: 'listAgents',
    name: 'List Agents',
    description: 'List all available agents',
    category: 'agent',
  },
  getAgent: {
    id: 'getAgent',
    name: 'Get Agent',
    description: 'Get agent details',
    category: 'agent',
  },
  updateAgent: {
    id: 'updateAgent',
    name: 'Update Agent',
    description: 'Update agent configuration',
    category: 'agent',
  },
  setAgentEnabled: {
    id: 'setAgentEnabled',
    name: 'Enable/Disable Agent',
    description: 'Enable or disable an agent',
    category: 'agent',
  },
  toggleAgentFavorite: {
    id: 'toggleAgentFavorite',
    name: 'Toggle Favorite',
    description: 'Toggle agent favorite status',
    category: 'agent',
  },

  // Skill tools
  listSkills: {
    id: 'listSkills',
    name: 'List Skills',
    description: 'List all available skills',
    category: 'skill',
  },
  getSkill: {
    id: 'getSkill',
    name: 'Get Skill',
    description: 'Get detailed information about a specific skill',
    category: 'skill',
  },
  grepSkills: {
    id: 'grepSkills',
    name: 'Grep Skills',
    description: 'Search across skill files for content matching a pattern',
    category: 'skill',
  },
  readSkillFile: {
    id: 'readSkillFile',
    name: 'Read Skill File',
    description: 'Read a skill file with optional partial reading',
    category: 'skill',
  },
  executeSkill: {
    id: 'executeSkill',
    name: 'Execute Skill',
    description: 'Execute a tool using CLI-style syntax',
    category: 'skill',
  },
  createSkill: {
    id: 'createSkill',
    name: 'Create Skill',
    description: 'Create a new user skill with documentation',
    category: 'skill',
  },
  updateSkill: {
    id: 'updateSkill',
    name: 'Update Skill',
    description: 'Update an existing user skill',
    category: 'skill',
  },
  deleteSkill: {
    id: 'deleteSkill',
    name: 'Delete Skill',
    description: 'Delete a user skill',
    category: 'skill',
  },
};

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
