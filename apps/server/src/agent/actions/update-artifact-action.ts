import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ArtifactsFeature } from '../../features/artifacts';
import { updateArtifactSchema } from '@agent-kit/shared';

export interface UpdateArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createUpdateArtifactAction(context: UpdateArtifactContext): Tool {
  return tool({
    description:
      'Update an existing artifact/document. Can update the title, content, or summary. Use readArtifact first to get the current content if you need to modify it.',
    inputSchema: updateArtifactSchema,
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
