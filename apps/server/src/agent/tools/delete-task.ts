import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';

export interface DeleteTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createDeleteTaskTool(context: DeleteTaskContext): Tool {
  return tool({
    description:
      'Delete a task. This action is permanent and cannot be undone. Any attached artifacts will be unlinked but not deleted.',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('The ID of the task to delete'),
    }),
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
