/**
 * Actions - for performing specific operations
 *
 * Organized by category:
 * - Static (utility): getTime, webSearch, extractContent, fetch
 * - Artifact: writeArtifact, searchArtifacts, readArtifact, updateArtifact
 * - Project: listProjects, searchProjects, getProject, createProject, updateProject, deleteProject
 * - Task: listTasks, searchTasks, getTask, createTask, updateTask, deleteTask, moveTask, reorderTask, attachArtifactToTask, detachArtifactFromTask
 * - Navigation: navigateTo, getCurrentUIState
 * - Agent: listAgents, getAgent, updateAgent, setAgentEnabled, toggleAgentFavorite
 * - Skill Management: listSkills, getSkill, createSkill, updateSkill, deleteSkill
 */

import type { Tool } from '../types';
import type { ToolContext } from './types';
import { logger } from '../logger';

// Static actions (no context needed)
import { getTimeTool } from './get-time';
import { webSearchTool } from './web-search';
import { extractContentTool } from './extract-content';
import { fetchTool } from './fetch';

// Artifact actions
import { createWriteArtifactTool } from './write-artifact';
import { createSearchArtifactsTool } from './search-artifacts';
import { createReadArtifactTool } from './read-artifact';
import { createUpdateArtifactTool } from './update-artifact';

// Project actions
import { createListProjectsTool } from './list-projects';
import { createSearchProjectsTool } from './search-projects';
import { createGetProjectTool } from './get-project';
import { createCreateProjectTool } from './create-project';
import { createUpdateProjectTool } from './update-project';
import { createDeleteProjectTool } from './delete-project';

// Task actions
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

// Client-side actions
import {
  createNavigateToTool,
  createGetCurrentUIStateTool,
} from './client-tools';

// Agent actions
import { createListAgentsTool } from './list-agents';
import { createGetAgentTool } from './get-agent';
import { createUpdateAgentTool } from './update-agent';
import { createSetAgentEnabledTool } from './set-agent-enabled';
import { createToggleAgentFavoriteTool } from './toggle-agent-favorite';

// Skill management actions
import { createCreateSkillTool } from './create-skill';
import { createUpdateSkillTool } from './update-skill';
import { createDeleteSkillTool } from './delete-skill';
import { createListSkillsTool } from './list-skills';
import { createGetSkillTool } from './get-skill';

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
  // Agent actions
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
export type ContextActionId = (typeof ACTION_IDS)[number];
export type ActionId = StaticActionId | ContextActionId;

/**
 * Get actions by their IDs
 * Static actions don't require context, context-aware actions do
 */
export function getActionsById(
  ids: string[],
  context?: ToolContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};

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
        case 'readArtifact':
          result[id] = createReadArtifactTool(context);
          break;
        case 'updateArtifact':
          result[id] = createUpdateArtifactTool(context);
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
      }
    }
  }

  return result;
}

/**
 * List all action IDs (static + context-aware)
 */
export function listActionIds(): string[] {
  return [...Object.keys(STATIC_ACTIONS), ...ACTION_IDS];
}
