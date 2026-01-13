import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { TasksFeature } from '../../../features/tasks';
import {
  TaskStatusSchema,
  TaskPrioritySchema,
} from '../../../features/tasks/schemas';

export const createTaskMetadata: ActionMetadata = {
  id: 'createTask',
  requiredScopes: [AgentScope.TASKS_WRITE],
  needsApproval: true,
};

export interface CreateTaskContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createCreateTaskTool(context: CreateTaskContext): Tool {
  return tool({
    description:
      'Create a new task in a project. The task will be added to the "todo" column by default.',
    inputSchema: z.object({
      projectId: z
        .string()
        .uuid()
        .describe('The project ID to create the task in'),
      title: z.string().min(1).max(255).describe('The task title'),
      description: z
        .string()
        .max(5000)
        .optional()
        .describe('Detailed task description'),
      priority: TaskPrioritySchema.default('medium').describe(
        'Task priority: low, medium, high, or urgent'
      ),
      status: TaskStatusSchema.default('todo').describe(
        'Task status: backlog, todo, in_progress, review, or done'
      ),
    }),
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
