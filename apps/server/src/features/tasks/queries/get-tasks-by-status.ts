import { eq, and, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts, type TaskStatus } from '../../../db/schema';
import type { TasksByStatus, TaskListItem } from '../types';

export class GetTasksByStatusQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    projectId: string,
    userId: string,
    orgId: string
  ): Promise<TasksByStatus> {
    const results = await this.db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        position: tasks.position,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        artifactCount: sql<number>`count(${taskArtifacts.id})::int`,
      })
      .from(tasks)
      .leftJoin(taskArtifacts, eq(tasks.id, taskArtifacts.taskId))
      .where(
        and(
          eq(tasks.projectId, projectId),
          eq(tasks.userId, userId),
          eq(tasks.orgId, orgId)
        )
      )
      .groupBy(tasks.id)
      .orderBy(tasks.position);

    // Group by status
    const tasksByStatus: TasksByStatus = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    for (const task of results) {
      const item: TaskListItem = {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        position: task.position,
        completedAt: task.completedAt,
        artifactCount: task.artifactCount,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      tasksByStatus[task.status as TaskStatus].push(item);
    }

    return tasksByStatus;
  }
}
