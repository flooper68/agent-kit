import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';

export interface SearchTasksContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createSearchTasksTool(context: SearchTasksContext): Tool {
  return tool({
    description:
      'Search for tasks across all projects by title or description. Returns matching tasks with their project information.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe('Search query to match against task titles and descriptions'),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe('Maximum number of results'),
    }),
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      const results = await context.tasksFeature.search({
        userId: context.userId,
        orgId: context.orgId,
        query,
        limit: limit ?? 20,
      });

      return {
        tasks: results.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          projectId: t.projectId,
        })),
        total: results.length,
      };
    },
  });
}
