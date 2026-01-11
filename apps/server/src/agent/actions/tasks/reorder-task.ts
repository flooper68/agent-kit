import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { TasksFeature } from '../../../features/tasks';

export const reorderTaskMetadata: ActionMetadata = {
  id: 'reorderTask',
  requiredScopes: [AgentScope.TASKS_WRITE],
};

export interface ReorderTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createReorderTaskTool(context: ReorderTaskContext): Tool {
  return tool({
    description:
      'Reorder a task within its current status column. Use this to change the priority/order of tasks without changing their status. Position 0 is the top of the column.',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('The task ID to reorder'),
      position: z
        .number()
        .min(0)
        .describe(
          'New position in the column (0 = top, higher numbers = lower in the list)'
        ),
    }),
    execute: async ({
      taskId,
      position,
    }: {
      taskId: string;
      position: number;
    }) => {
      // First get the task to find its current status
      const task = await context.tasksFeature.getById({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!task) {
        return {
          success: false,
          message: 'Task not found or you do not have access to it.',
        };
      }

      // Move the task to the new position within the same status
      const moved = await context.tasksFeature.move({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
        status: task.status,
        position,
      });

      if (!moved) {
        return {
          success: false,
          message: 'Failed to reorder task.',
        };
      }

      return {
        success: true,
        task: {
          id: moved.id,
          title: moved.title,
          status: moved.status,
          position: moved.position,
        },
        message: `Task "${moved.title}" moved to position ${position} in the ${moved.status} column.`,
      };
    },
  });
}
