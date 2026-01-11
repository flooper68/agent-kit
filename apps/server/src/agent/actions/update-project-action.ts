import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { updateProjectSchema } from '@agent-kit/shared';

export interface UpdateProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createUpdateProjectAction(context: UpdateProjectContext): Tool {
  return tool({
    description:
      'Update an existing project. You can change the title and/or summary.',
    inputSchema: updateProjectSchema,
    execute: async ({
      projectId,
      title,
      summary,
    }: {
      projectId: string;
      title?: string;
      summary?: string | null;
    }) => {
      const project = await context.projectsFeature.update({
        id: projectId,
        userId: context.userId,
        orgId: context.orgId,
        title,
        summary,
      });

      if (!project) {
        return {
          success: false,
          error:
            'Project not found or you do not have permission to update it.',
        };
      }

      return {
        success: true,
        project: {
          id: project.id,
          title: project.title,
          summary: project.summary,
        },
        message: `Project "${project.title}" updated successfully.`,
      };
    },
  });
}
