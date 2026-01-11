import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { moveTaskSchema } from '@agent-kit/shared';

export interface MoveTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createMoveTaskAction(context: MoveTaskContext): Tool {
  return tool({
    description:
      'Move a task to a different status column (backlog, todo, in_progress, review, done). Use this to update task progress.',
    inputSchema: moveTaskSchema,
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
