import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { getProjectSchema } from '@agent-kit/shared';

export interface GetProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createGetProjectAction(context: GetProjectContext): Tool {
  return tool({
    description:
      'Get detailed information about a specific project by ID, including task counts and recent tasks.',
    inputSchema: getProjectSchema,
    execute: async ({ projectId }: { projectId: string }) => {
      const project = await context.projectsFeature.getById({
        id: projectId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!project) {
        return {
          found: false,
          message: 'Project not found or you do not have access to it.',
        };
      }

      // Calculate task counts from tasksByStatus
      const taskCounts = {
        backlog: project.tasksByStatus.backlog?.length ?? 0,
        todo: project.tasksByStatus.todo?.length ?? 0,
        in_progress: project.tasksByStatus.in_progress?.length ?? 0,
        review: project.tasksByStatus.review?.length ?? 0,
        done: project.tasksByStatus.done?.length ?? 0,
      };

      return {
        found: true,
        id: project.id,
        title: project.title,
        summary: project.summary,
        taskCounts,
        tasksByStatus: project.tasksByStatus,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    },
  });
}
