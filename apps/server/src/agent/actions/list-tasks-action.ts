import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { TasksFeature } from '../../features/tasks';
import { listTasksSchema } from '@agent-kit/shared';

export interface ListTasksContext {
  userId: string;
  orgId: string;
  tasksFeature: TasksFeature;
}

export function createListTasksAction(context: ListTasksContext): Tool {
  return tool({
    description:
      'List tasks in a project with optional filters. Can filter by status, priority, or tasks with artifacts.',
    inputSchema: listTasksSchema,
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
