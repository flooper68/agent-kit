import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { projects, tasks, projectArtifacts } from '../../../db/schema';
import type { ProjectListItem } from './list-projects';

export interface SearchProjectsInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
}

export type SearchProjectsResult = ProjectListItem[];

export class SearchProjectsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: SearchProjectsInput): Promise<SearchProjectsResult> {
    const { userId, orgId, query, limit } = input;

    const searchPattern = `%${escapeLikePattern(query.trim())}%`;

    const results = await this.db
      .select({
        id: projects.id,
        title: projects.title,
        summary: projects.summary,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        backlogCount: sql<number>`count(case when ${tasks.status} = 'backlog' then 1 end)::int`,
        todoCount: sql<number>`count(case when ${tasks.status} = 'todo' then 1 end)::int`,
        inProgressCount: sql<number>`count(case when ${tasks.status} = 'in_progress' then 1 end)::int`,
        reviewCount: sql<number>`count(case when ${tasks.status} = 'review' then 1 end)::int`,
        doneCount: sql<number>`count(case when ${tasks.status} = 'done' then 1 end)::int`,
        totalCount: sql<number>`count(${tasks.id})::int`,
        artifactCount: sql<number>`(
          SELECT count(*)::int
          FROM ${projectArtifacts}
          WHERE ${projectArtifacts.projectId} = ${projects.id}
        )`,
      })
      .from(projects)
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .where(
        and(
          eq(projects.orgId, orgId),
          eq(projects.userId, userId),
          or(
            ilike(projects.title, searchPattern),
            ilike(projects.summary, searchPattern)
          )
        )
      )
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      taskCounts: {
        backlog: r.backlogCount,
        todo: r.todoCount,
        inProgress: r.inProgressCount,
        review: r.reviewCount,
        done: r.doneCount,
        total: r.totalCount,
      },
      artifactCount: r.artifactCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
