import { eq, sql, gte, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { tasks, type TaskStatus, type TaskPriority } from '../../../db/schema';
import type { TaskStats } from '../types';

export class GetTaskStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(orgId: string): Promise<TaskStats> {
    // Get counts by status
    const statusCounts = await this.db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId))
      .groupBy(tasks.status);

    // Get counts by priority
    const priorityCounts = await this.db
      .select({
        priority: tasks.priority,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId))
      .groupBy(tasks.priority);

    // Get completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [completedThisWeekResult] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.orgId, orgId),
          eq(tasks.status, 'done'),
          gte(tasks.completedAt, weekAgo)
        )
      );

    // Build stats object
    const byStatus: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    let totalTasks = 0;
    for (const sc of statusCounts) {
      byStatus[sc.status] = sc.count;
      totalTasks += sc.count;
    }

    const byPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    for (const pc of priorityCounts) {
      byPriority[pc.priority] = pc.count;
    }

    return {
      totalTasks,
      byStatus,
      byPriority,
      completedThisWeek: completedThisWeekResult?.count ?? 0,
    };
  }
}
