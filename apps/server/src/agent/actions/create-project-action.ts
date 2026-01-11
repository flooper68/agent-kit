import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { createProjectSchema } from '@agent-kit/shared';

export interface CreateProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createCreateProjectAction(context: CreateProjectContext): Tool {
  return tool({
    description:
      'Create a new project for organizing tasks. Projects contain a Kanban board with todo, in_progress, review, and done columns.',
    inputSchema: createProjectSchema,
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
