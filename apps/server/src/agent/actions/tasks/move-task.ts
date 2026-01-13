import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { TasksFeature } from '../../../features/tasks';
import { TaskStatusSchema } from '../../../features/tasks/schemas';

export const moveTaskMetadata: ActionMetadata = {
  id: 'moveTask',
  requiredScopes: [AgentScope.TASKS_WRITE],
  needsApproval: true,
};

export interface MoveTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createMoveTaskTool(context: MoveTaskContext): Tool {
  return tool({
    description:
      'Move a task to a different status column (backlog, todo, in_progress, review, done). Use this to update task progress.',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('The task ID to move'),
      status: TaskStatusSchema.describe(
        'The new status: backlog, todo, in_progress, review, or done'
      ),
      position: z
        .number()
        .min(0)
        .default(0)
        .describe('Position in the column (0 = top). Defaults to top.'),
    }),
    execute: async ({
      taskId,
      status,
      position,
    }: {
      taskId: string;
      status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
      position?: number;
    }) => {
      const moved = await context.tasksFeature.move({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
        status,
        position: position ?? 0,
      });

      if (!moved) {
        return {
          success: false,
          message: 'Task not found or you do not have access to it.',
        };
      }

      const statusLabels: Record<string, string> = {
        backlog: 'Backlog',
        todo: 'Todo',
        in_progress: 'In Progress',
        review: 'Review',
        done: 'Done',
      };

      return {
        success: true,
        task: {
          id: moved.id,
          title: moved.title,
          status: moved.status,
          completedAt: moved.completedAt,
        },
        message: `Task moved to "${statusLabels[status]}" column.`,
      };
    },
  });
}
