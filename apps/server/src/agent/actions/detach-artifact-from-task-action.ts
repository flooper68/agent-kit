import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { detachArtifactFromTaskSchema } from '@agent-kit/shared';

export interface DetachArtifactFromTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createDetachArtifactFromTaskAction(
  context: DetachArtifactFromTaskContext
): Tool {
  return tool({
    description:
      'Detach an artifact (document) from a task. This removes the link between the artifact and the task.',
    inputSchema: detachArtifactFromTaskSchema,
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
