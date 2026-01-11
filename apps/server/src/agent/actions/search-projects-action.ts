import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ProjectsFeature } from '../../features/projects';
import { searchProjectsSchema } from '@agent-kit/shared';

export interface SearchProjectsContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createSearchProjectsAction(context: SearchProjectsContext): Tool {
  return tool({
    description:
      'Search for projects by title or summary. Returns matching projects with their task counts.',
    inputSchema: searchProjectsSchema,
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      const results = await context.projectsFeature.search({
        userId: context.userId,
        orgId: context.orgId,
        query,
        limit: limit ?? 10,
      });

      return {
        projects: results.map((p) => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          taskCounts: p.taskCounts,
        })),
        total: results.length,
      };
    },
  });
}
