import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ProjectsFeature } from '../../features/projects';

export interface ListProjectsContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createListProjectsTool(context: ListProjectsContext): Tool {
  return tool({
    description:
      'List all projects available to the user. Returns project titles, summaries, and task counts.',
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe('Maximum number of projects to return'),
    }),
    execute: async ({ limit }: { limit?: number }) => {
      const result = await context.projectsFeature.list({
        userId: context.userId,
        orgId: context.orgId,
        limit: limit ?? 20,
      });

      return {
        projects: result.items.map((p) => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          taskCounts: p.taskCounts,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total: result.items.length,
        hasMore: !!result.nextCursor,
      };
    },
  });
}
