import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';

export interface DetachArtifactFromTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createDetachArtifactFromTaskTool(
  context: DetachArtifactFromTaskContext
): Tool {
  return tool({
    description:
      'Detach an artifact (document) from a task. This removes the link between the artifact and the task.',
    inputSchema: z.object({
      taskId: z
        .string()
        .uuid()
        .describe('The task ID to detach the artifact from'),
      artifactId: z.string().uuid().describe('The artifact ID to detach'),
    }),
    execute: async ({
      taskId,
      artifactId,
    }: {
      taskId: string;
      artifactId: string;
    }) => {
      const detached = await context.tasksFeature.detachArtifact({
        taskId,
        artifactId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!detached) {
        return {
          success: true,
          wasAttached: false,
          message: 'Artifact was not attached to this task.',
        };
      }

      return {
        success: true,
        wasAttached: true,
        message: 'Artifact detached from task successfully.',
      };
    },
  });
}
