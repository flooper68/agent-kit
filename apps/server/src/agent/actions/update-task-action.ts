import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { updateTaskSchema } from '@agent-kit/shared';

export interface UpdateTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createUpdateTaskAction(context: UpdateTaskContext): Tool {
  return tool({
    description:
      'Update task details like title, description, or priority. Use moveTask to change the task status.',
    inputSchema: updateTaskSchema,
    execute: async ({
      taskId,
      title,
      description,
      priority,
    }: {
      taskId: string;
      title?: string;
      description?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const updated = await context.tasksFeature.update({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
        title,
        description,
        priority,
      });

      if (!updated) {
        return {
          success: false,
          message: 'Task not found or you do not have access to it.',
        };
      }

      return {
        success: true,
        task: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          status: updated.status,
          priority: updated.priority,
        },
        message: 'Task updated successfully.',
      };
    },
  });
}
