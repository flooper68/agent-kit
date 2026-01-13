import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ArtifactsFeature } from '../../../features/artifacts';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';

const MAX_CONTENT_SIZE = 1_000_000; // 1MB

export const patchArtifactMetadata: ActionMetadata = {
  id: 'patchArtifact',
  requiredScopes: [AgentScope.ARTIFACTS_WRITE],
};

export interface PatchArtifactContext {
  userId: string;
  orgId: string;
  artifactsFeature: ArtifactsFeature;
}

export function createPatchArtifactTool(context: PatchArtifactContext): Tool {
  return tool({
    description:
      'Patch an artifact by replacing a specific line range with new content. Use getArtifact first to see the current content and line numbers. Lines are 1-indexed. To delete lines, provide empty newContent. To insert without replacing, set endLine to startLine - 1.',
    // Requires user approval before execution
    needsApproval: true,
    inputSchema: z.object({
      artifactId: z.string().uuid().describe('The ID of the artifact to patch'),
      startLine: z
        .number()
        .int()
        .min(1, 'startLine must be at least 1')
        .describe('The starting line number (1-indexed, inclusive)'),
      endLine: z
        .number()
        .int()
        .describe(
          'The ending line number (1-indexed, inclusive). Set to startLine - 1 to insert without replacing.'
        ),
      newContent: z
        .string()
        .max(
          MAX_CONTENT_SIZE,
          `newContent must be ${MAX_CONTENT_SIZE} bytes or less`
        )
        .describe(
          'The content to replace the specified line range with. Empty string deletes the lines.'
        ),
    }),
    execute: async ({
      artifactId,
      startLine,
      endLine,
      newContent,
    }: {
      artifactId: string;
      startLine: number;
      endLine: number;
      newContent: string;
    }) => {
      try {
        const patched = await context.artifactsFeature.patch({
          id: artifactId,
          userId: context.userId,
          orgId: context.orgId,
          startLine,
          endLine,
          newContent,
        });

        if (!patched) {
          return {
            success: false,
            message: 'Artifact not found or you do not have access to it.',
          };
        }

        // Count total lines in the patched content
        const totalLines = patched.content.split('\n').length;

        return {
          success: true,
          artifact: {
            id: patched.id,
            title: patched.title,
            summary: patched.summary,
            sizeBytes: patched.sizeBytes,
            totalLines,
          },
          message: `Artifact "${patched.title}" patched successfully. Lines ${startLine}-${endLine} replaced.`,
        };
      } catch (error) {
        console.error('Failed to patch artifact:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          message: `Failed to patch artifact: ${errorMessage}`,
        };
      }
    },
  });
}
