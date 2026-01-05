import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentSessionManager } from '../agent-session-manager';
import type { PubSubManager } from '../../lib/redis/pubsub';
import { getTimeTool } from './get-time';
import { webSearchTool } from './web-search';
import { extractContentTool } from './extract-content';
import { createWriteArtifactTool } from './write-artifact';
import { createSearchArtifactsTool } from './search-artifacts';
import { createReadArtifactTool } from './read-artifact';
import { createListProjectsTool } from './list-projects';
import { createSearchProjectsTool } from './search-projects';
import { createGetProjectTool } from './get-project';
import { createCreateProjectTool } from './create-project';
import { createUpdateProjectTool } from './update-project';
import { createListTasksTool } from './list-tasks';
import { createSearchTasksTool } from './search-tasks';
import { createGetTaskTool } from './get-task';
import { createCreateTaskTool } from './create-task';
import { createUpdateTaskTool } from './update-task';
import { createMoveTaskTool } from './move-task';
import { createReorderTaskTool } from './reorder-task';
import { createAttachArtifactToTaskTool } from './attach-artifact-to-task';
import { createDetachArtifactFromTaskTool } from './detach-artifact-from-task';
import {
  createNavigateToTool,
  createGetCurrentUIStateTool,
} from './client-tools';

// Static tools (no context needed)
const STATIC_TOOLS: Record<string, Tool> = {
  getTime: getTimeTool,
  webSearch: webSearchTool,
  extractContent: extractContentTool,
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
  // Task tools
  'listTasks',
  'searchTasks',
  'getTask',
  'createTask',
  'updateTask',
  'moveTask',
  'reorderTask',
  'attachArtifactToTask',
  'detachArtifactFromTask',
  // Client-side tools
  'navigateTo',
  'getCurrentUIState',
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
  /** Session manager for client-side tools */
  sessionManager?: AgentSessionManager;
  /** Pub/Sub manager for stateful client-side tools */
  pubsub?: PubSubManager;
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
          }
          break;
        case 'searchProjects':
          if (context.projectsFeature) {
            result[id] = createSearchProjectsTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
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
          }
          break;
        case 'createProject':
          if (context.projectsFeature) {
            result[id] = createCreateProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
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
          }
          break;
        case 'searchTasks':
          if (context.tasksFeature) {
            result[id] = createSearchTasksTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
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
          }
          break;
        case 'createTask':
          if (context.tasksFeature) {
            result[id] = createCreateTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
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
          }
          break;
        case 'moveTask':
          if (context.tasksFeature) {
            result[id] = createMoveTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
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
          }
          break;
        case 'attachArtifactToTask':
          if (context.tasksFeature) {
            result[id] = createAttachArtifactToTaskTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
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
          }
          break;
        // Client-side tools
        case 'navigateTo':
          if (context.sessionManager && context.sessionId && context.messageId && context.pubsub) {
            result[id] = createNavigateToTool({
              sessionId: context.sessionId,
              messageId: context.messageId,
              sessionManager: context.sessionManager,
              pubsub: context.pubsub,
            });
          }
          break;
        case 'getCurrentUIState':
          if (context.sessionManager && context.sessionId && context.messageId && context.pubsub) {
            result[id] = createGetCurrentUIStateTool({
              sessionId: context.sessionId,
              messageId: context.messageId,
              sessionManager: context.sessionManager,
              pubsub: context.pubsub,
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
