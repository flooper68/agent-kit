import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const updateProjectMetadata: ActionMetadata = {
  id: 'updateProject',
  requiredScopes: [AgentScope.PROJECTS_WRITE],
  needsApproval: true,
};

export interface UpdateProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createUpdateProjectTool(context: UpdateProjectContext): Tool {
  return tool({
    description:
      'Update an existing project. You can change the title and/or summary.',
    inputSchema: z.object({
      projectId: z.string().uuid().describe('The ID of the project to update'),
      title: z
        .string()
        .min(1)
        .max(255)
        .optional()
        .describe('New project title'),
      summary: z
        .string()
        .max(1000)
        .nullable()
        .optional()
        .describe('New project summary (set to null to remove)'),
    }),
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
