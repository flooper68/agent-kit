import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { tasks, taskArtifacts, projects } from '../../../db/schema';
import type { TaskListItem } from './list-tasks-by-project';

export interface SearchTasksInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
}

export interface SearchTaskResult extends TaskListItem {
  projectTitle: string;
}

export type SearchTasksResult = SearchTaskResult[];

export class SearchTasksQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: SearchTasksInput): Promise<SearchTasksResult> {
    const searchPattern = `%${escapeLikePattern(input.query.trim())}%`;

    const results = await this.db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        projectTitle: projects.title,
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
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(taskArtifacts, eq(tasks.id, taskArtifacts.taskId))
      .where(
        and(
          eq(tasks.userId, input.userId),
          eq(tasks.orgId, input.orgId),
          or(
            ilike(tasks.title, searchPattern),
            ilike(tasks.description, searchPattern)
          )
        )
      )
      .groupBy(tasks.id, projects.title)
      .orderBy(desc(tasks.updatedAt))
      .limit(input.limit);

    return results.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      projectTitle: r.projectTitle,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      position: r.position,
      completedAt: r.completedAt,
      artifactCount: r.artifactCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
