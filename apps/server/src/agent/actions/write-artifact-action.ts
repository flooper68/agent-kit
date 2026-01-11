import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { ArtifactsFeature } from '../../features/artifacts';
import { writeArtifactSchema } from '@agent-kit/shared';

export interface WriteArtifactContext {
  userId: string;
  orgId: string;
  sessionId?: string;
  agentId?: string;
  artifactsFeature: ArtifactsFeature;
}

export function createWriteArtifactAction(context: WriteArtifactContext): Tool {
  return tool({
    description:
      'Create or save a markdown document/note. Use this when the user asks you to save, write, or create a document, note, or artifact.',
    inputSchema: writeArtifactSchema,
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
