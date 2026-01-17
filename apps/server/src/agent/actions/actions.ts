/**
 * Actions - for performing specific operations
 *
 * Organized by category:
 * - Static (utility): getTime, webSearch, extractContent, fetch
 * - Artifact: writeArtifact, searchArtifacts, getArtifact, updateArtifact
 * - Project: listProjects, searchProjects, getProject, createProject, updateProject, deleteProject, attachArtifactToProject, detachArtifactFromProject, listProjectArtifacts
 * - Task: listTasks, searchTasks, getTask, createTask, updateTask, deleteTask, moveTask, reorderTask, attachArtifactToTask, detachArtifactFromTask
 * - Client: navigateTo, getCurrentUIState
 * - Agent: listAgents, getAgent, createAgent, updateAgent, deleteAgent, setAgentEnabled, toggleAgentFavorite
 * - Skill Management: listSkills, getSkill, createSkill, updateSkill, deleteSkill
 */

import type { Tool } from '../types';
import type { ActionsContext } from './types';
import { logger } from '../../logger/logger';
import { AgentScope } from '../permissions/scopes';

// Static actions (no context needed)
import { getTimeTool, getTimeMetadata } from './static/get-time';
import { webSearchTool, webSearchMetadata } from './static/web-search';
import {
  extractContentTool,
  extractContentMetadata,
} from './static/extract-content';
import { fetchTool, fetchMetadata } from './static/fetch';

// Artifact actions
import {
  createWriteArtifactTool,
  writeArtifactMetadata,
} from './artifacts/write-artifact';
import {
  createSearchArtifactsTool,
  searchArtifactsMetadata,
} from './artifacts/search-artifacts';
import {
  createGetArtifactTool,
  getArtifactMetadata,
} from './artifacts/get-artifact';
import {
  createUpdateArtifactTool,
  updateArtifactMetadata,
} from './artifacts/update-artifact';
import {
  createPatchArtifactTool,
  patchArtifactMetadata,
} from './artifacts/patch-artifact';
import type { ActionMetadata } from './types';

// Project actions
import {
  createListProjectsTool,
  listProjectsMetadata,
} from './projects/list-projects';
import {
  createSearchProjectsTool,
  searchProjectsMetadata,
} from './projects/search-projects';
import {
  createGetProjectTool,
  getProjectMetadata,
} from './projects/get-project';
import {
  createCreateProjectTool,
  createProjectMetadata,
} from './projects/create-project';
import {
  createUpdateProjectTool,
  updateProjectMetadata,
} from './projects/update-project';
import {
  createDeleteProjectTool,
  deleteProjectMetadata,
} from './projects/delete-project';
import {
  createAttachArtifactToProjectTool,
  attachArtifactToProjectMetadata,
} from './projects/attach-artifact-to-project';
import {
  createDetachArtifactFromProjectTool,
  detachArtifactFromProjectMetadata,
} from './projects/detach-artifact-from-project';
import {
  createListProjectArtifactsTool,
  listProjectArtifactsMetadata,
} from './projects/list-project-artifacts';

// Task actions
import { createListTasksTool, listTasksMetadata } from './tasks/list-tasks';
import {
  createSearchTasksTool,
  searchTasksMetadata,
} from './tasks/search-tasks';
import { createGetTaskTool, getTaskMetadata } from './tasks/get-task';
import { createCreateTaskTool, createTaskMetadata } from './tasks/create-task';
import { createUpdateTaskTool, updateTaskMetadata } from './tasks/update-task';
import { createMoveTaskTool, moveTaskMetadata } from './tasks/move-task';
import {
  createReorderTaskTool,
  reorderTaskMetadata,
} from './tasks/reorder-task';
import {
  createAttachArtifactToTaskTool,
  attachArtifactToTaskMetadata,
} from './tasks/attach-artifact-to-task';
import {
  createDetachArtifactFromTaskTool,
  detachArtifactFromTaskMetadata,
} from './tasks/detach-artifact-from-task';
import { createDeleteTaskTool, deleteTaskMetadata } from './tasks/delete-task';

// Client-side actions
import { createNavigateToTool, navigateToMetadata } from './client/navigate-to';
import {
  createGetCurrentUIStateTool,
  getCurrentUIStateMetadata,
} from './client/get-current-ui-state';

// Agent actions
import { createListAgentsTool, listAgentsMetadata } from './agents/list-agents';
import { createGetAgentTool, getAgentMetadata } from './agents/get-agent';
import {
  createUpdateAgentTool,
  updateAgentMetadata,
} from './agents/update-agent';
import {
  createSetAgentEnabledTool,
  setAgentEnabledMetadata,
} from './agents/set-agent-enabled';
import {
  createToggleAgentFavoriteTool,
  toggleAgentFavoriteMetadata,
} from './agents/toggle-agent-favorite';
import {
  createCreateAgentTool,
  createAgentMetadata,
} from './agents/create-agent';
import {
  createDeleteAgentTool,
  deleteAgentMetadata,
} from './agents/delete-agent';

// Skill management actions
import {
  createCreateSkillTool,
  createSkillMetadata,
} from './skills/create-skill';
import {
  createUpdateSkillTool,
  updateSkillMetadata,
} from './skills/update-skill';
import {
  createDeleteSkillTool,
  deleteSkillMetadata,
} from './skills/delete-skill';
import { createListSkillsTool, listSkillsMetadata } from './skills/list-skills';
import { createGetSkillTool, getSkillMetadata } from './skills/get-skill';

/**
 * Collected metadata from all actions with scope requirements.
 * Used by permission system to check required scopes for actions.
 */
export const ACTION_METADATA: Record<string, ActionMetadata> = {
  // Static actions
  [getTimeMetadata.id]: getTimeMetadata,
  [webSearchMetadata.id]: webSearchMetadata,
  [extractContentMetadata.id]: extractContentMetadata,
  [fetchMetadata.id]: fetchMetadata,

  // Artifact actions
  [writeArtifactMetadata.id]: writeArtifactMetadata,
  [getArtifactMetadata.id]: getArtifactMetadata,
  [searchArtifactsMetadata.id]: searchArtifactsMetadata,
  [updateArtifactMetadata.id]: updateArtifactMetadata,
  [patchArtifactMetadata.id]: patchArtifactMetadata,

  // Project actions
  [listProjectsMetadata.id]: listProjectsMetadata,
  [searchProjectsMetadata.id]: searchProjectsMetadata,
  [getProjectMetadata.id]: getProjectMetadata,
  [createProjectMetadata.id]: createProjectMetadata,
  [updateProjectMetadata.id]: updateProjectMetadata,
  [deleteProjectMetadata.id]: deleteProjectMetadata,
  [attachArtifactToProjectMetadata.id]: attachArtifactToProjectMetadata,
  [detachArtifactFromProjectMetadata.id]: detachArtifactFromProjectMetadata,
  [listProjectArtifactsMetadata.id]: listProjectArtifactsMetadata,

  // Task actions
  [listTasksMetadata.id]: listTasksMetadata,
  [searchTasksMetadata.id]: searchTasksMetadata,
  [getTaskMetadata.id]: getTaskMetadata,
  [createTaskMetadata.id]: createTaskMetadata,
  [updateTaskMetadata.id]: updateTaskMetadata,
  [moveTaskMetadata.id]: moveTaskMetadata,
  [reorderTaskMetadata.id]: reorderTaskMetadata,
  [attachArtifactToTaskMetadata.id]: attachArtifactToTaskMetadata,
  [detachArtifactFromTaskMetadata.id]: detachArtifactFromTaskMetadata,
  [deleteTaskMetadata.id]: deleteTaskMetadata,

  // Client actions
  [navigateToMetadata.id]: navigateToMetadata,
  [getCurrentUIStateMetadata.id]: getCurrentUIStateMetadata,

  // Agent actions
  [listAgentsMetadata.id]: listAgentsMetadata,
  [getAgentMetadata.id]: getAgentMetadata,
  [createAgentMetadata.id]: createAgentMetadata,
  [updateAgentMetadata.id]: updateAgentMetadata,
  [deleteAgentMetadata.id]: deleteAgentMetadata,
  [setAgentEnabledMetadata.id]: setAgentEnabledMetadata,
  [toggleAgentFavoriteMetadata.id]: toggleAgentFavoriteMetadata,

  // Skill actions
  [listSkillsMetadata.id]: listSkillsMetadata,
  [getSkillMetadata.id]: getSkillMetadata,
  [createSkillMetadata.id]: createSkillMetadata,
  [updateSkillMetadata.id]: updateSkillMetadata,
  [deleteSkillMetadata.id]: deleteSkillMetadata,
};

/**
 * Get the required scopes for an action from its metadata.
 * Returns empty array if action has no scope requirements.
 */
export function getActionRequiredScopes(actionId: string): AgentScope[] {
  const metadata = ACTION_METADATA[actionId];
  return metadata?.requiredScopes ?? [];
}

/**
 * Check if an action requires user approval before execution.
 * Returns false if action not found or doesn't require approval.
 */
export function getActionNeedsApproval(actionId: string): boolean {
  const metadata = ACTION_METADATA[actionId];
  return metadata?.needsApproval ?? false;
}

/**
 * Static actions (no context needed)
 */
export const STATIC_ACTIONS: Record<string, Tool> = {
  getTime: getTimeTool,
  webSearch: webSearchTool,
  extractContent: extractContentTool,
  fetch: fetchTool,
};

/**
 * Context-aware action IDs
 */
export const ACTION_IDS = [
  // Artifact actions
  'writeArtifact',
  'searchArtifacts',
  'getArtifact',
  'updateArtifact',
  'patchArtifact',
  // Project actions
  'listProjects',
  'searchProjects',
  'getProject',
  'createProject',
  'updateProject',
  'deleteProject',
  'attachArtifactToProject',
  'detachArtifactFromProject',
  'listProjectArtifacts',
  // Task actions
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
  // Client-side actions
  'navigateTo',
  'getCurrentUIState',
  // Agent actions
  'listAgents',
  'getAgent',
  'createAgent',
  'updateAgent',
  'deleteAgent',
  'setAgentEnabled',
  'toggleAgentFavorite',
  // Skill management actions
  'listSkills',
  'getSkill',
  'createSkill',
  'updateSkill',
  'deleteSkill',
] as const;

export type StaticActionId = keyof typeof STATIC_ACTIONS;
export type ContextActionId = (typeof ACTION_IDS)[number];
export type ActionId = StaticActionId | ContextActionId;

/**
 * Get actions by their IDs
 * Static actions don't require context, context-aware actions do
 */
export function getActionsById(
  ids: string[],
  context?: ActionsContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};
  const unknownIds: string[] = [];

  for (const id of ids) {
    // Check static actions first (no context needed)
    const staticAction = STATIC_ACTIONS[id];
    if (staticAction) {
      result[id] = staticAction;
      continue;
    }

    // Create context-aware actions if context is provided
    if (context) {
      switch (id) {
        // Artifact actions
        case 'writeArtifact':
          result[id] = createWriteArtifactTool(context);
          break;
        case 'searchArtifacts':
          result[id] = createSearchArtifactsTool(context);
          break;
        case 'getArtifact':
          result[id] = createGetArtifactTool(context);
          break;
        case 'updateArtifact':
          result[id] = createUpdateArtifactTool(context);
          break;
        case 'patchArtifact':
          result[id] = createPatchArtifactTool(context);
          break;
        // Project actions
        case 'listProjects':
          if (context.projectsFeature) {
            result[id] = createListProjectsTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
            });
          }
          break;
        case 'attachArtifactToProject':
          if (context.projectsFeature) {
            result[id] = createAttachArtifactToProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
            });
          }
          break;
        case 'detachArtifactFromProject':
          if (context.projectsFeature) {
            result[id] = createDetachArtifactFromProjectTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
            });
          }
          break;
        case 'listProjectArtifacts':
          if (context.projectsFeature) {
            result[id] = createListProjectArtifactsTool({
              userId: context.userId,
              orgId: context.orgId,
              projectsFeature: context.projectsFeature,
            });
          } else {
            logger.debug('Skipping action due to missing projectsFeature', {
              action: id,
            });
          }
          break;
        // Task actions
        case 'listTasks':
          if (context.tasksFeature) {
            result[id] = createListTasksTool({
              userId: context.userId,
              orgId: context.orgId,
              tasksFeature: context.tasksFeature,
            });
          } else {
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
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
            logger.debug('Skipping action due to missing tasksFeature', {
              action: id,
            });
          }
          break;
        // Client-side actions
        case 'navigateTo':
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
        // Agent actions
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
        case 'createAgent':
          result[id] = createCreateAgentTool({
            userId: context.userId,
            orgId: context.orgId,
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
        case 'deleteAgent':
          result[id] = createDeleteAgentTool({
            userId: context.userId,
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
        // Skill management actions
        case 'listSkills':
          result[id] = createListSkillsTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
            allowedSkillIds: context.allowedSkillIds,
          });
          break;
        case 'getSkill':
          result[id] = createGetSkillTool({
            userId: context.userId,
            orgId: context.orgId,
            skillsFeature: context.skillsFeature,
            allowedSkillIds: context.allowedSkillIds,
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
        default:
          unknownIds.push(id);
      }
    } else {
      // No context provided for non-static action
      unknownIds.push(id);
    }
  }

  if (unknownIds.length > 0) {
    throw new Error(`Unknown action ID(s): ${unknownIds.join(', ')}`);
  }

  return result;
}

/**
 * List all action IDs (static + context-aware)
 */
export function listActionIds(): string[] {
  return [...Object.keys(STATIC_ACTIONS), ...ACTION_IDS];
}
