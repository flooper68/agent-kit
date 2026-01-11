import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const listProjectArtifactsMetadata: ActionMetadata = {
  id: 'listProjectArtifacts',
  requiredScopes: [AgentScope.PROJECTS_READ],
};

export interface ListProjectArtifactsContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createListProjectArtifactsTool(
  context: ListProjectArtifactsContext
): Tool {
  return tool({
    description:
      'List artifacts (documents) attached to a project. Supports pagination and search.',
    inputSchema: z.object({
      projectId: z
        .string()
        .uuid()
        .describe('The project ID to list artifacts for'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(20)
        .describe('Maximum number of artifacts to return (1-100, default 20)'),
      cursor: z
        .string()
        .uuid()
        .optional()
        .describe('Cursor for pagination (artifact ID from previous page)'),
      search: z
        .string()
        .optional()
        .describe('Search term to filter artifacts by title or summary'),
    }),
    execute: async ({
      projectId,
      limit = 20,
      cursor,
      search,
    }: {
      projectId: string;
      limit?: number;
      cursor?: string;
      search?: string;
    }) => {
      const result = await context.projectsFeature.listArtifacts({
        projectId,
        userId: context.userId,
        orgId: context.orgId,
        limit,
        cursor,
        search,
      });

      return {
        items: result.items.map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          format: item.format,
          sizeBytes: item.sizeBytes,
          createdAt: item.createdAt.toISOString(),
          attachedAt: item.attachedAt.toISOString(),
        })),
        nextCursor: result.nextCursor,
        total: result.total,
      };
    },
  });
}
