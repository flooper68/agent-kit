import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';
import { TaskPrioritySchema } from '../../features/tasks/schemas';

export interface UpdateTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createUpdateTaskTool(context: UpdateTaskContext): Tool {
  return tool({
    description:
      'Update task details like title, description, or priority. Use moveTask to change the task status.',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('The task ID to update'),
      title: z.string().min(1).max(255).optional().describe('New task title'),
      description: z
        .string()
        .max(5000)
        .nullable()
        .optional()
        .describe('New task description (null to clear)'),
      priority: TaskPrioritySchema.optional().describe(
        'New priority: low, medium, high, or urgent'
      ),
    }),
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
