import { eq, and, inArray, sql, type SQL, gt } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts } from '../../../db/schema';
import type { ListTasksInput, TaskListItem } from '../types';

export class ListTasksByProjectQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: ListTasksInput): Promise<TaskListItem[]> {
    const conditions: SQL[] = [
      eq(tasks.projectId, input.projectId),
      eq(tasks.userId, input.userId),
      eq(tasks.orgId, input.orgId),
    ];

    // Filter by status
    if (input.status && input.status.length > 0) {
      conditions.push(inArray(tasks.status, input.status));
    }

    // Filter by priority
    if (input.priority && input.priority.length > 0) {
      conditions.push(inArray(tasks.priority, input.priority));
    }

    // Build HAVING clause for hasArtifacts filter
    const havingConditions: SQL[] = [];
    if (input.hasArtifacts !== undefined) {
      if (input.hasArtifacts) {
        havingConditions.push(gt(sql<number>`count(${taskArtifacts.id})`, 0));
      } else {
        havingConditions.push(sql`count(${taskArtifacts.id}) = 0`);
      }
    }

    // Base query with artifact count and HAVING clause
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
      .where(and(...conditions))
      .groupBy(tasks.id)
      .having(
        havingConditions.length > 0 ? and(...havingConditions) : undefined
      )
      .orderBy(tasks.status, tasks.position);

    return results;
  }
}
