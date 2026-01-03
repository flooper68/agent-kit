import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';

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
    inputSchema: z.object({
      title: z.string().describe('The title of the document'),
      content: z.string().describe('The markdown content of the document'),
      summary: z
        .string()
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
    },
  });
}
