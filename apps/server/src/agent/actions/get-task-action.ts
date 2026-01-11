import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { getTaskSchema } from '@agent-kit/shared';

export interface GetTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createGetTaskAction(context: GetTaskContext): Tool {
  return tool({
    description:
      'Get detailed information about a specific task by ID, including attached artifacts and event history.',
    inputSchema: getTaskSchema,
    execute: async ({ taskId }: { taskId: string }) => {
      const task = await context.tasksFeature.getById({
        id: taskId,
        userId: context.userId,
        orgId: context.orgId,
      });

      if (!task) {
        return {
          found: false,
          message: 'Task not found or you do not have access to it.',
        };
      }

      return {
        found: true,
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        completedAt: task.completedAt,
        events: task.events,
        artifacts: task.artifacts,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    },
  });
}
