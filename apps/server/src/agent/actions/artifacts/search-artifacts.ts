import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

export const searchArtifactsMetadata: ActionMetadata = {
  id: 'searchArtifacts',
  requiredScopes: [AgentScope.ARTIFACTS_READ],
};

export interface SearchArtifactsContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createSearchArtifactsTool(
  context: SearchArtifactsContext
): Tool {
  return tool({
    description:
      'Search through saved documents/notes by title and summary. Use "*" to list all documents. Use this when the user asks to find, look up, or list previously saved documents.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1, 'Search query is required')
        .max(500, 'Search query is too long')
        .refine(
          (val) => val === '*' || val.trim().length > 0,
          'Search query cannot be only whitespace'
        )
        .describe(
          'Search query to match against document titles and summaries. Use "*" to list all documents.'
        ),
      limit: z
        .number()
        .int()
        .min(1, 'Number must be greater than or equal to 1')
        .max(50, 'Number must be less than or equal to 50')
        .optional()
        .default(10)
        .describe('Maximum number of results to return'),
      offset: z
        .number()
        .int()
        .min(0, 'Number must be greater than or equal to 0')
        .optional()
        .default(0)
        .describe('Number of results to skip for pagination'),
    }),
    execute: async ({
      query,
      limit,
      offset,
    }: {
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        const { results, totalCount } = await context.artifactsFeature.search({
          userId: context.userId,
          orgId: context.orgId,
          query,
          limit: limit ?? 10,
          offset: offset ?? 0,
        });

        if (results.length === 0) {
          return {
            found: false,
            message:
              query === '*'
                ? 'No documents found.'
                : 'No documents found matching your search.',
            results: [],
            totalCount: 0,
          };
        }

        return {
          found: true,
          count: results.length,
          totalCount,
          results: results.map((r) => ({
            id: r.id,
            title: r.title,
            summary: r.summary,
            createdAt: r.createdAt,
          })),
        };
      } catch (error) {
        console.error('Failed to search artifacts:', error);
        return {
          found: false,
          message: 'Failed to search. Please try again.',
          results: [],
          totalCount: 0,
        };
      }
    },
  });
}
