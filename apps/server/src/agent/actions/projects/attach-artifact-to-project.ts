import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { ProjectsFeature } from '../../../features/projects';

export const attachArtifactToProjectMetadata: ActionMetadata = {
  id: 'attachArtifactToProject',
  requiredScopes: [AgentScope.PROJECTS_WRITE],
};

export interface AttachArtifactToProjectContext {
  userId: string;
  orgId: string;
  projectsFeature: ProjectsFeature;
}

export function createAttachArtifactToProjectTool(
  context: AttachArtifactToProjectContext
): Tool {
  return tool({
    description:
      'Attach an artifact (document) to a project. This links the artifact to the project for reference.',
    inputSchema: z.object({
      projectId: z
        .string()
        .uuid()
        .describe('The project ID to attach the artifact to'),
      artifactId: z.string().uuid().describe('The artifact ID to attach'),
    }),
    execute: async ({
      projectId,
      artifactId,
    }: {
      projectId: string;
      artifactId: string;
    }) => {
      const result = await context.projectsFeature.attachArtifact({
        projectId,
        artifactId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (result.alreadyAttached) {
        return {
          success: true,
          alreadyAttached: true,
          message: 'Artifact was already attached to this project.',
        };
      }

      return {
        success: true,
        alreadyAttached: false,
        message: 'Artifact attached to project successfully.',
      };
    },
  });
}
