import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { deleteTaskSchema } from '@agent-kit/shared';

export interface DeleteTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createDeleteTaskAction(context: DeleteTaskContext): Tool {
  return tool({
    description:
      'Delete a task. This action is permanent and cannot be undone. Any attached artifacts will be unlinked but not deleted.',
    inputSchema: deleteTaskSchema,
    execute: async ({ taskId }: { taskId: string }) => {
      const task = await context.tasksFeature.delete({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!task) {
        return {
          success: false,
          error: 'Task not found or you do not have permission to delete it.',
        };
      }

      return {
        success: true,
        deletedTask: {
          id: task.id,
          title: task.title,
          projectId: task.projectId,
        },
        message: `Task "${task.title}" has been permanently deleted.`,
      };
    },
  });
}
