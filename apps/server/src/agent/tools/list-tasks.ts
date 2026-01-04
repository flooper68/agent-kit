import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { TasksFeature } from '../../features/tasks';

const TaskStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
]);
const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export interface ListTasksContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createListTasksTool(context: ListTasksContext): Tool {
  return tool({
    description:
      'List tasks in a project with optional filters. Can filter by status, priority, or tasks with artifacts.',
    inputSchema: z.object({
      projectId: z
        .string()
        .uuid()
        .describe('The project ID to list tasks from'),
      status: z
        .array(TaskStatusSchema)
        .optional()
        .describe(
          'Filter by task status(es): backlog, todo, in_progress, review, done'
        ),
      priority: z
        .array(TaskPrioritySchema)
        .optional()
        .describe('Filter by priority: low, medium, high, urgent'),
      hasArtifacts: z
        .boolean()
        .optional()
        .describe('Only show tasks with attached artifacts'),
    }),
    execute: async ({
      projectId,
      status,
      priority,
      hasArtifacts,
    }: {
      projectId: string;
      status?: ('backlog' | 'todo' | 'in_progress' | 'review' | 'done')[];
      priority?: ('low' | 'medium' | 'high' | 'urgent')[];
      hasArtifacts?: boolean;
    }) => {
      const tasks = await context.tasksFeature.listByProject({
        projectId,
        userId: context.userId,
        orgId: context.orgId,
        status,
        priority,
        hasArtifacts,
      });

      return {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          completedAt: t.completedAt,
          artifactCount: t.artifactCount,
        })),
        total: tasks.length,
      };
    },
  });
}
