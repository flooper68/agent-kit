import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { attachArtifactToTaskSchema } from '@agent-kit/shared';

export interface AttachArtifactToTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createAttachArtifactToTaskAction(
  context: AttachArtifactToTaskContext
): Tool {
  return tool({
    description:
      'Attach an artifact (document) to a task. This links the artifact to the task for reference.',
    inputSchema: attachArtifactToTaskSchema,
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
