import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const detachArtifactFromProjectMetadata: ActionMetadata = {
  id: 'detachArtifactFromProject',
  requiredScopes: [AgentScope.PROJECTS_WRITE],
};

export interface DetachArtifactFromProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createDetachArtifactFromProjectTool(
  context: DetachArtifactFromProjectContext
): Tool {
  return tool({
    description:
      'Detach an artifact (document) from a project. This removes the link between the artifact and the project.',
    inputSchema: z.object({
      projectId: z
        .string()
        .uuid()
        .describe('The project ID to detach the artifact from'),
      artifactId: z.string().uuid().describe('The artifact ID to detach'),
    }),
    execute: async ({
      projectId,
      artifactId,
    }: {
      projectId: string;
      artifactId: string;
    }) => {
      const result = await context.projectsFeature.detachArtifact({
        projectId,
        artifactId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!result.wasAttached) {
        return {
          success: true,
          wasAttached: false,
          message: 'Artifact was not attached to this project.',
        };
      }

      return {
        success: true,
        wasAttached: true,
        message: 'Artifact detached from project successfully.',
      };
    },
  });
}
