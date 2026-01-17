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
      'Read a saved document by its ID. Supports partial reads with startLine (1-indexed) and limit parameters.',
    inputSchema: z.object({
      artifactId: z
        .string()
        .uuid()
        .describe('The unique ID of the document to read'),
      startLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          'Line number to start reading from (1-indexed). Omit to start from beginning.'
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
      startLine,
      limit,
    }: {
      artifactId: string;
      startLine?: number;
      limit?: number;
    }) => {
      try {
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

        // Apply startLine and limit if specified (startLine is 1-indexed)
        if (startLine !== undefined || limit !== undefined) {
          // Convert 1-indexed startLine to 0-indexed for slice
          const startIndex = startLine !== undefined ? startLine - 1 : 0;

          // Validate startLine is positive (Zod validates min(1), but defensive check)
          if (startIndex < 0) {
            return {
              found: true,
              id: artifact.id,
              title: artifact.title,
              error: `startLine must be positive, got ${startLine}`,
              totalLines,
              content: '',
              summary: artifact.summary,
            };
          }

          // Validate startLine is within document bounds
          if (startIndex >= lines.length) {
            return {
              found: true,
              id: artifact.id,
              title: artifact.title,
              error: `startLine ${startLine} exceeds document length (${lines.length} lines)`,
              totalLines,
              content: '',
              summary: artifact.summary,
            };
          }

          const endIndex =
            limit !== undefined ? startIndex + limit : lines.length;
          content = lines.slice(startIndex, endIndex).join('\n');
          truncated = endIndex < lines.length || startIndex > 0;
        }

        return {
          found: true,
          id: artifact.id,
          title: artifact.title,
          content,
          totalLines,
          truncated,
          startLine: startLine ?? 1,
          linesReturned: content.split('\n').length,
          summary: artifact.summary,
          projects: artifact.projects,
          tasks: artifact.tasks,
          createdAt: artifact.createdAt,
          updatedAt: artifact.updatedAt,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          found: false,
          error: `Failed to retrieve artifact: ${message}`,
        };
      }
    },
  });
}
