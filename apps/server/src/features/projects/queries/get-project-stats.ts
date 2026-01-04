import { eq, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { projects, tasks, type TaskStatus } from '../../../db/schema';
import type { ProjectStats } from '../types';

export class GetProjectStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(orgId: string): Promise<ProjectStats> {
    // Get total projects count
    const [projectCount] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(eq(projects.orgId, orgId));

    // Get task counts by status
    const taskCounts = await this.db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(eq(tasks.orgId, orgId))
      .groupBy(tasks.status);

    // Build tasksByStatus map
    const tasksByStatus: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    let totalTasks = 0;
    for (const tc of taskCounts) {
      tasksByStatus[tc.status] = tc.count;
      totalTasks += tc.count;
    }

    return {
      totalProjects: projectCount?.count ?? 0,
      totalTasks,
      tasksByStatus,
    };
  }
}
