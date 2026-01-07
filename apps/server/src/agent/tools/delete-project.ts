import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ProjectsFeature } from '../../features/projects';

export interface DeleteProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createDeleteProjectTool(context: DeleteProjectContext): Tool {
  return tool({
    description:
      'Delete a project and all its tasks. This action is permanent and cannot be undone.',
    inputSchema: z.object({
      projectId: z.string().uuid().describe('The ID of the project to delete'),
    }),
    execute: async ({ projectId }: { projectId: string }) => {
      const project = await context.projectsFeature.delete(
        projectId,
        context.userId,
        context.orgId
      );

      if (!project) {
        return {
          success: false,
          error:
            'Project not found or you do not have permission to delete it.',
        };
      }

      return {
        success: true,
        deletedProject: {
          id: project.id,
          title: project.title,
        },
        message: `Project "${project.title}" and all its tasks have been permanently deleted.`,
      };
    },
  });
}
