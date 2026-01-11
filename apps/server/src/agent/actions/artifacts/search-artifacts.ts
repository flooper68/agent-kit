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
      'Search through saved documents/notes by title and summary. Use an empty query to list recent documents. Use this when the user asks to find, look up, or list previously saved documents.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search query to match against document titles and summaries. Use empty string to list recent documents.'
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of results to return'),
      offset: z
        .number()
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
            query.trim() === ''
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
    },
  });
}
