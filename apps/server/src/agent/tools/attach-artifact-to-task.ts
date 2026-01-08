import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';

export interface AttachArtifactToTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createAttachArtifactToTaskTool(
  context: AttachArtifactToTaskContext
): Tool {
  return tool({
    description:
      'Attach an artifact (document) to a task. This links the artifact to the task for reference.',
    inputSchema: z.object({
      taskId: z
        .string()
        .uuid()
        .describe('The task ID to attach the artifact to'),
      artifactId: z.string().uuid().describe('The artifact ID to attach'),
    }),
    execute: async ({
      taskId,
      artifactId,
    }: {
      taskId: string;
      artifactId: string;
    }) => {
      const attached = await context.tasksFeature.attachArtifact({
        taskId,
        artifactId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!attached) {
        return {
          success: true,
          alreadyAttached: true,
          message: 'Artifact was already attached to this task.',
        };
      }

      return {
        success: true,
        alreadyAttached: false,
        message: 'Artifact attached to task successfully.',
      };
    },
  });
}
