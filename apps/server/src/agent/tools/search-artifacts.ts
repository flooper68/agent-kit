import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';

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
      'Search through saved documents/notes by title and summary. Use this when the user asks to find or look up a previously saved document.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search query to match against document titles and summaries'
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum number of results to return'),
    }),
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      const results = await context.artifactsFeature.search({
        userId: context.userId,
        orgId: context.orgId,
        query,
        limit: limit ?? 10,
      });

      if (results.length === 0) {
        return {
          found: false,
          message: 'No documents found matching your search.',
          results: [],
        };
      }

      return {
        found: true,
        count: results.length,
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
