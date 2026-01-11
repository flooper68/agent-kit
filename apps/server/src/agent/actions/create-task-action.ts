import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { createTaskSchema } from '@agent-kit/shared';

export interface CreateTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createCreateTaskAction(context: CreateTaskContext): Tool {
  return tool({
    description:
      'Create a new task in a project. The task will be added to the "todo" column by default.',
    inputSchema: createTaskSchema,
    execute: async ({
      projectId,
      title,
      description,
      priority,
      status,
    }: {
      projectId: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
    }) => {
      const task = await context.tasksFeature.create({
        projectId,
        userId: context.userId,
        orgId: context.orgId,
        title,
        description,
        priority: priority ?? 'medium',
        status: status ?? 'todo',
      });

      return {
        success: true,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId,
        },
        message: `Task "${title}" created successfully in the ${task.status} column.`,
      };
    },
  });
}
