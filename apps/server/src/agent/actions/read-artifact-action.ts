import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ArtifactsFeature } from '../../features/artifacts';
import { readArtifactSchema } from '@agent-kit/shared';

export interface ReadArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createReadArtifactAction(context: ReadArtifactContext): Tool {
  return tool({
    description:
      'Read the full content of a saved document by its ID. Use this after searching to retrieve the complete document content.',
    inputSchema: readArtifactSchema,
    execute: async ({ artifactId }: { artifactId: string }) => {
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

      return {
        found: true,
        id: artifact.id,
        title: artifact.title,
        content: artifact.content,
        summary: artifact.summary,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      };
    },
  });
}
