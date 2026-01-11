import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ArtifactsFeature } from '../../features/artifacts';
import { searchArtifactsSchema } from '@agent-kit/shared';

export interface SearchArtifactsContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createSearchArtifactsAction(
  context: SearchArtifactsContext
): Tool {
  return tool({
    description:
      'Search through saved documents/notes by title and summary. Use an empty query to list recent documents. Use this when the user asks to find, look up, or list previously saved documents.',
    inputSchema: searchArtifactsSchema,
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
