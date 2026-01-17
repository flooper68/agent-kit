import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

export const listArtifactsMetadata: ActionMetadata = {
  id: 'listArtifacts',
  requiredScopes: [AgentScope.ARTIFACTS_READ],
};

export interface ListArtifactsContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createListArtifactsTool(context: ListArtifactsContext): Tool {
  return tool({
    description:
      'List all artifacts/documents for the user. Returns a paginated list of artifacts sorted by creation date (newest first). Use this to browse all saved documents.',
    inputSchema: z.object({
      limit: z
        .number()
        .int()
        .min(1, 'Number must be greater than or equal to 1')
        .max(100, 'Number must be less than or equal to 100')
        .optional()
        .default(20)
        .describe('Number of artifacts to return (1-100, default 20)'),
      offset: z
        .number()
        .int()
        .min(0, 'Number must be greater than or equal to 0')
        .optional()
        .default(0)
        .describe('Number of artifacts to skip (for pagination)'),
    }),
    execute: async ({
      limit,
      offset,
    }: {
      limit?: number;
      offset?: number;
    }) => {
      try {
        const effectiveLimit = limit ?? 20;
        const effectiveOffset = offset ?? 0;

        // Fetch extra items to handle offset simulation
        // Note: The underlying list() uses cursor-based pagination,
        // so we fetch limit + offset items and slice for offset support
        const fetchLimit = effectiveLimit + effectiveOffset;

        const result = await context.artifactsFeature.list({
          userId: context.userId,
          orgId: context.orgId,
          limit: fetchLimit,
        });

        // Apply offset by slicing
        const slicedItems = result.items.slice(
          effectiveOffset,
          effectiveOffset + effectiveLimit
        );

        if (slicedItems.length === 0) {
          return {
            artifacts: [],
            total: 0,
            hasMore: false,
            message: 'No artifacts found.',
          };
        }

        // Determine hasMore: either we have a nextCursor from the query,
        // or we fetched more items than we're returning
        const hasMore =
          !!result.nextCursor || result.items.length > effectiveOffset + effectiveLimit;

        return {
          artifacts: slicedItems.map((a) => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          })),
          total: slicedItems.length,
          hasMore,
        };
      } catch (error) {
        console.error('Failed to list artifacts:', error);
        return {
          artifacts: [],
          total: 0,
          hasMore: false,
          message: 'Failed to list artifacts. Please try again.',
        };
      }
    },
  });
}
