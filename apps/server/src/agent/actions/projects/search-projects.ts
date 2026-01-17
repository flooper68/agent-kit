import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const searchProjectsMetadata: ActionMetadata = {
  id: 'searchProjects',
  requiredScopes: [AgentScope.PROJECTS_READ],
};

export interface SearchProjectsContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createSearchProjectsTool(context: SearchProjectsContext): Tool {
  return tool({
    description:
      'Search for projects by title or summary. Returns matching projects with their task counts.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe('Search query to match against project titles and summaries'),
      limit: z
        .number()
        .int()
        .min(1, 'Number must be greater than or equal to 1')
        .max(20, 'Number must be less than or equal to 20')
        .optional()
        .default(10)
        .describe('Maximum number of results'),
    }),
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      try {
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
      } catch (error) {
        console.error('Failed to search projects:', error);
        return {
          found: false,
          message: 'Failed to search. Please try again.',
          projects: [],
          total: 0,
        };
      }
    },
  });
}
