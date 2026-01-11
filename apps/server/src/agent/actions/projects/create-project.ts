import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const createProjectMetadata: ActionMetadata = {
  id: 'createProject',
  requiredScopes: [AgentScope.PROJECTS_WRITE],
};

export interface CreateProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createCreateProjectTool(context: CreateProjectContext): Tool {
  return tool({
    description:
      'Create a new project for organizing tasks. Projects contain a Kanban board with todo, in_progress, review, and done columns.',
    inputSchema: z.object({
      title: z.string().min(1).max(255).describe('The project title'),
      summary: z
        .string()
        .max(1000)
        .optional()
        .describe('Optional project summary or description'),
    }),
    execute: async ({
      title,
      summary,
    }: {
      title: string;
      summary?: string;
    }) => {
      const project = await context.projectsFeature.create({
        userId: context.userId,
        orgId: context.orgId,
        title,
        summary,
      });

      return {
        success: true,
        project: {
          id: project.id,
          title: project.title,
          summary: project.summary,
        },
        message: `Project "${title}" created successfully.`,
      };
    },
  });
}
