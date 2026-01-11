import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { listProjectsSchema } from '@agent-kit/shared';

export interface ListProjectsContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createListProjectsAction(context: ListProjectsContext): Tool {
  return tool({
    description:
      'List all projects available to the user. Returns project titles, summaries, and task counts.',
    inputSchema: listProjectsSchema,
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
