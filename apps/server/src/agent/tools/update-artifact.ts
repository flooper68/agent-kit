import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';

const MAX_CONTENT_SIZE = 1_000_000; // 1MB

export interface UpdateArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createUpdateArtifactTool(context: UpdateArtifactContext): Tool {
  return tool({
    description:
      'Update an existing artifact/document. Can update the title, content, or summary. Use readArtifact first to get the current content if you need to modify it.',
    inputSchema: z.object({
      artifactId: z
        .string()
        .uuid()
        .describe('The ID of the artifact to update'),
      title: z
        .string()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title must be 255 characters or less')
        .optional()
        .describe('New title for the document'),
      content: z
        .string()
        .min(1, 'Content cannot be empty')
        .max(
          MAX_CONTENT_SIZE,
          `Content must be ${MAX_CONTENT_SIZE} bytes or less`
        )
        .optional()
        .describe('New markdown content (replaces entire content)'),
      summary: z
        .string()
        .max(500, 'Summary must be 500 characters or less')
        .optional()
        .describe('New summary for search purposes'),
    }),
    execute: async ({
      artifactId,
      title,
      content,
      summary,
    }: {
      artifactId: string;
      title?: string;
      content?: string;
      summary?: string;
    }) => {
      // Require at least one field to update
      if (!title && !content && !summary) {
        return {
          success: false,
          message:
            'At least one field (title, content, or summary) must be provided.',
        };
      }

      try {
        const updated = await context.artifactsFeature.update({
          id: artifactId,
          userId: context.userId,
          orgId: context.orgId,
          title,
          content,
          summary,
        });

        if (!updated) {
          return {
            success: false,
            message: 'Artifact not found or you do not have access to it.',
          };
        }

        return {
          success: true,
          artifact: {
            id: updated.id,
            title: updated.title,
            summary: updated.summary,
            sizeBytes: updated.sizeBytes,
          },
          message: `Artifact "${updated.title}" updated successfully.`,
        };
      } catch (error) {
        console.error('Failed to update artifact:', error);
        return {
          success: false,
          message: 'Failed to update artifact. Please try again.',
        };
      }
    },
  });
}
