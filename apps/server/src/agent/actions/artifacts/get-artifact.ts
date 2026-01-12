import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

export const getArtifactMetadata: ActionMetadata = {
  id: 'getArtifact',
  requiredScopes: [AgentScope.ARTIFACTS_READ],
};

export interface GetArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createGetArtifactTool(context: GetArtifactContext): Tool {
  return tool({
    description:
      'Read a saved document by its ID. Supports partial reads with offset and limit parameters (like head/tail commands).',
    inputSchema: z.object({
      artifactId: z
        .string()
        .uuid()
        .describe('The unique ID of the document to read'),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          'Line number to start reading from (0-indexed). Omit to start from beginning.'
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          'Maximum number of lines to return. Omit to return all content.'
        ),
    }),
    execute: async ({
      artifactId,
      offset,
      limit,
    }: {
      artifactId: string;
      offset?: number;
      limit?: number;
    }) => {
      const artifact = await context.artifactsFeature.getById({
        id: artifactId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!artifact) {
        return {
          found: false,
          message: 'Document not found or you do not have access to it.',
        };
      }

      let content = artifact.content;
      const lines = content.split('\n');
      const totalLines = lines.length;
      let truncated = false;

      // Apply offset and limit if specified
      if (offset !== undefined || limit !== undefined) {
        const startLine = offset ?? 0;
        const endLine = limit !== undefined ? startLine + limit : lines.length;
        content = lines.slice(startLine, endLine).join('\n');
        truncated = endLine < lines.length || startLine > 0;
      }

      return {
        found: true,
        id: artifact.id,
        title: artifact.title,
        content,
        totalLines,
        truncated,
        offset: offset ?? 0,
        linesReturned: content.split('\n').length,
        summary: artifact.summary,
        projects: artifact.projects,
        tasks: artifact.tasks,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      };
    },
  });
}
