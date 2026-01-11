import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { deleteProjectSchema } from '@agent-kit/shared';

export interface DeleteProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createDeleteProjectAction(context: DeleteProjectContext): Tool {
  return tool({
    description:
      'Delete a project and all its tasks. This action is permanent and cannot be undone.',
    inputSchema: deleteProjectSchema,
    execute: async ({ projectId }: { projectId: string }) => {
      const project = await context.projectsFeature.delete({
        id: projectId,
        userId: context.userId,
        orgId: context.orgId,
      });

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
