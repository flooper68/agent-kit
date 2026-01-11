import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

export const readArtifactMetadata: ActionMetadata = {
  id: 'readArtifact',
  requiredScopes: [AgentScope.ARTIFACTS_READ],
};

export interface ReadArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createReadArtifactTool(context: ReadArtifactContext): Tool {
  return tool({
    description:
      'Read the full content of a saved document by its ID. Use this after searching to retrieve the complete document content.',
    inputSchema: z.object({
      artifactId: z
        .string()
        .uuid()
        .describe('The unique ID of the document to read'),
    }),
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
        projects: artifact.projects,
        tasks: artifact.tasks,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      };
    },
  });
}
