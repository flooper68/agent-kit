import { eq, and, sql, inArray, gt, ilike, or, type SQL } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  tasks,
  taskArtifacts,
  type TaskStatus,
  type TaskPriority,
} from '../../../db/schema';
import type { TaskListItem } from './list-tasks-by-project';

/**
 * Escapes special SQL LIKE pattern characters to prevent pattern injection.
 * Characters %, _, and \ have special meaning in LIKE patterns.
 */
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export interface GetTasksByStatusInput {
  projectId: string;
  userId: string;
  orgId: string;
  priority?: TaskPriority[];
  hasArtifacts?: boolean;
  searchQuery?: string;
}

export interface TasksByStatus {
  backlog: TaskListItem[];
  todo: TaskListItem[];
  in_progress: TaskListItem[];
  review: TaskListItem[];
  done: TaskListItem[];
}

export type GetTasksByStatusResult = TasksByStatus;

export class GetTasksByStatusQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetTasksByStatusInput): Promise<GetTasksByStatusResult> {
    const { projectId, userId, orgId, priority, hasArtifacts, searchQuery } =
      input;

    const conditions: SQL[] = [
      eq(tasks.projectId, projectId),
      eq(tasks.userId, userId),
      eq(tasks.orgId, orgId),
    ];

    // Filter by priority
    if (priority && priority.length > 0) {
      conditions.push(inArray(tasks.priority, priority));
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const escapedQuery = escapeLikePattern(searchQuery.trim());
      const searchPattern = `%${escapedQuery}%`;
      const searchCondition = or(
        ilike(tasks.title, searchPattern),
        ilike(tasks.description, searchPattern)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build HAVING clause for hasArtifacts filter
    const havingConditions: SQL[] = [];
    if (hasArtifacts !== undefined) {
      if (hasArtifacts) {
        havingConditions.push(gt(sql<number>`count(${taskArtifacts.id})`, 0));
      } else {
        havingConditions.push(sql`count(${taskArtifacts.id}) = 0`);
      }
    }

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
      .orderBy(tasks.position, tasks.createdAt);

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
