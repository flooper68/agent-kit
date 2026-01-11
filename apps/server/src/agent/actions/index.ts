/**
 * Actions - callable only via executeCommand tool
 *
 * This module contains all actions that agents can execute through the
 * executeCommand tool. Unlike basic tools (which are exposed directly
 * as MCP tools), actions are only accessible via CLI-style commands.
 */

import type { Tool } from '../shared/types';
import { logger } from '../shared/logger';

// Static action imports (no context needed)
import { getTimeAction } from './get-time-action';
import { webSearchAction } from './web-search-action';
import { extractContentAction } from './extract-content-action';
import { fetchAction } from './fetch-action';

// Context-aware action imports
import { createWriteArtifactAction } from './write-artifact-action';
import { createSearchArtifactsAction } from './search-artifacts-action';
import { createReadArtifactAction } from './read-artifact-action';
import { createUpdateArtifactAction } from './update-artifact-action';
import { createListProjectsAction } from './list-projects-action';
import { createSearchProjectsAction } from './search-projects-action';
import { createGetProjectAction } from './get-project-action';
import { createCreateProjectAction } from './create-project-action';
import { createUpdateProjectAction } from './update-project-action';
import { createDeleteProjectAction } from './delete-project-action';
import { createListTasksAction } from './list-tasks-action';
import { createSearchTasksAction } from './search-tasks-action';
import { createGetTaskAction } from './get-task-action';
import { createCreateTaskAction } from './create-task-action';
import { createUpdateTaskAction } from './update-task-action';
import { createMoveTaskAction } from './move-task-action';
import { createReorderTaskAction } from './reorder-task-action';
import { createAttachArtifactToTaskAction } from './attach-artifact-to-task-action';
import { createDetachArtifactFromTaskAction } from './detach-artifact-from-task-action';
import { createDeleteTaskAction } from './delete-task-action';
import {
  createNavigateToAction,
  createGetCurrentUIStateAction,
} from './client-actions';
import { createListAgentsAction } from './list-agents-action';
import { createGetAgentAction } from './get-agent-action';
import { createUpdateAgentAction } from './update-agent-action';
import { createSetAgentEnabledAction } from './set-agent-enabled-action';
import { createToggleAgentFavoriteAction } from './toggle-agent-favorite-action';
import { createCreateSkillAction } from './create-skill-action';
import { createUpdateSkillAction } from './update-skill-action';
import { createDeleteSkillAction } from './delete-skill-action';
import { createListSkillsAction } from './list-skills-action';
import { createGetSkillAction } from './get-skill-action';

// Import ToolContext type from tools index
import type { ToolContext } from '../tools';

// Static actions (no context needed)
const STATIC_ACTIONS: Record<string, Tool> = {
  getTime: getTimeAction,
  webSearch: webSearchAction,
  extractContent: extractContentAction,
  fetch: fetchAction,
};

// Context-aware action IDs (only callable via executeCommand)
const CONTEXT_ACTION_IDS = [
  // Artifact actions
  'writeArtifact',
  'searchArtifacts',
  'readArtifact',
  'updateArtifact',
  // Project actions
  'listProjects',
  'searchProjects',
  'getProject',
  'createProject',
  'updateProject',
  'deleteProject',
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
  // Agent management actions
  'listAgents',
  'getAgent',
  'updateAgent',
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
export type ContextActionId = (typeof CONTEXT_ACTION_IDS)[number];
export type ActionId = StaticActionId | ContextActionId;

/**
 * Get actions by their IDs (all non-basic tools callable via executeCommand)
 */
export function getActionsById(
  ids: string[],
  context: ToolContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};

  for (const id of ids) {
    // Check static actions first
    const staticAction = STATIC_ACTIONS[id];
    if (staticAction) {
      result[id] = staticAction;
      continue;
    }

    // Create context-aware actions
    switch (id) {
      // Artifact actions
      case 'writeArtifact':
        result[id] = createWriteArtifactAction(context);
        break;
      case 'searchArtifacts':
        result[id] = createSearchArtifactsAction(context);
        break;
      case 'readArtifact':
        result[id] = createReadArtifactAction(context);
        break;
      case 'updateArtifact':
        result[id] = createUpdateArtifactAction(context);
        break;
      // Project actions
      case 'listProjects':
        if (context.projectsFeature) {
          result[id] = createListProjectsAction({
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
          result[id] = createSearchProjectsAction({
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
          result[id] = createGetProjectAction({
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
          result[id] = createCreateProjectAction({
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
          result[id] = createUpdateProjectAction({
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
          result[id] = createDeleteProjectAction({
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
          result[id] = createListTasksAction({
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
          result[id] = createSearchTasksAction({
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
          result[id] = createGetTaskAction({
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
          result[id] = createCreateTaskAction({
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
          result[id] = createUpdateTaskAction({
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
          result[id] = createDeleteTaskAction({
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
          result[id] = createMoveTaskAction({
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
          result[id] = createReorderTaskAction({
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
          result[id] = createAttachArtifactToTaskAction({
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
          result[id] = createDetachArtifactFromTaskAction({
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
        // Fire-and-forget action - doesn't need pubsub
        result[id] = createNavigateToAction({
          sessionId: context.sessionId,
          messageId: context.messageId,
          eventStreamManager: context.eventStreamManager,
        });
        break;
      case 'getCurrentUIState':
        result[id] = createGetCurrentUIStateAction({
          sessionId: context.sessionId,
          messageId: context.messageId,
          eventStreamManager: context.eventStreamManager,
          pubsub: context.pubsub,
        });
        break;
      // Agent management actions
      case 'listAgents':
        result[id] = createListAgentsAction({
          userId: context.userId,
          agentsFeature: context.agentsFeature,
        });
        break;
      case 'getAgent':
        result[id] = createGetAgentAction({
          userId: context.userId,
          agentsFeature: context.agentsFeature,
        });
        break;
      case 'updateAgent':
        result[id] = createUpdateAgentAction({
          userId: context.userId,
          orgId: context.orgId,
          agentsFeature: context.agentsFeature,
        });
        break;
      case 'setAgentEnabled':
        result[id] = createSetAgentEnabledAction({
          userId: context.userId,
          agentsFeature: context.agentsFeature,
        });
        break;
      case 'toggleAgentFavorite':
        result[id] = createToggleAgentFavoriteAction({
          userId: context.userId,
          agentsFeature: context.agentsFeature,
        });
        break;
      // Skill management actions
      case 'listSkills':
        result[id] = createListSkillsAction({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
          allowedSkillIds: context.allowedSkillIds,
        });
        break;
      case 'getSkill':
        result[id] = createGetSkillAction({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
          allowedSkillIds: context.allowedSkillIds,
        });
        break;
      case 'createSkill':
        result[id] = createCreateSkillAction({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
        });
        break;
      case 'updateSkill':
        result[id] = createUpdateSkillAction({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
        });
        break;
      case 'deleteSkill':
        result[id] = createDeleteSkillAction({
          userId: context.userId,
          orgId: context.orgId,
          skillsFeature: context.skillsFeature,
        });
        break;
    }
  }

  return result;
}

/**
 * List all action IDs (including static and context-aware)
 */
export function listActionIds(): string[] {
  return [...Object.keys(STATIC_ACTIONS), ...CONTEXT_ACTION_IDS];
}
