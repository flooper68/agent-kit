import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { searchTasksSchema } from '@agent-kit/shared';

export interface SearchTasksContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createSearchTasksAction(context: SearchTasksContext): Tool {
  return tool({
    description:
      'Search for tasks across all projects by title or description. Returns matching tasks with their project information.',
    inputSchema: searchTasksSchema,
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
