import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
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
  // Agent spawning
  'spawnAgent',
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
  /** Event stream manager for client-side tools */
  eventStreamManager?: EventStreamManager;
  /** Pub/Sub manager for stateful client-side tools */
  pubsub?: PubSubManager;
  /** Agent spawner for spawnAgent tool */
  agentSpawner?: AgentSpawner;
  /** Current spawn depth for recursion tracking (0 for root sessions) */
  currentSpawnDepth?: number;
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
