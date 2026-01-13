import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

const MAX_CONTENT_SIZE = 1_000_000; // 1MB

export const writeArtifactMetadata: ActionMetadata = {
  id: 'writeArtifact',
  requiredScopes: [AgentScope.ARTIFACTS_WRITE],
};

export interface WriteArtifactContext {
  userId: string;
  orgId: string;
  sessionId?: string;
  agentId?: string;
  artifactsFeature: ArtifactsFeature;
}

export function createWriteArtifactTool(context: WriteArtifactContext): Tool {
  return tool({
    description:
      'Create or save a markdown document/note. Use this when the user asks you to save, write, or create a document, note, or artifact.',
    // Requires user approval before execution
    needsApproval: true,
    inputSchema: z.object({
      title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be 255 characters or less')
        .describe('The title of the document'),
      content: z
        .string()
        .min(1, 'Content is required')
        .max(
          MAX_CONTENT_SIZE,
          `Content must be ${MAX_CONTENT_SIZE} bytes or less`
        )
        .describe('The markdown content of the document (max 1MB)'),
      summary: z
        .string()
        .max(500, 'Summary must be 500 characters or less')
        .optional()
        .describe(
          'A brief 1-2 sentence summary of the content for search purposes'
        ),
    }),
    execute: async ({
      title,
      content,
      summary,
    }: {
      title: string;
      content: string;
      summary?: string;
    }) => {
      try {
        const artifact = await context.artifactsFeature.create({
          userId: context.userId,
          orgId: context.orgId,
          sessionId: context.sessionId,
          agentId: context.agentId,
          title,
          content,
          summary,
        });

        return {
          success: true,
          artifactId: artifact.id,
          title: artifact.title,
          message: `Document "${title}" saved successfully.`,
        };
      } catch (error) {
        console.error('Failed to create artifact:', error);
        return {
          success: false,
          message: 'Failed to save document. Please try again.',
        };
      }
    },
  });
}
