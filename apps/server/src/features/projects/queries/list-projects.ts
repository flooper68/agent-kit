import { eq, desc, lt, and, or, ilike, sql, type SQL } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { projects, tasks, projectArtifacts } from '../../../db/schema';

export interface ListProjectsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface TaskCounts {
  backlog: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  total: number;
}

export interface ProjectListItem {
  id: string;
  title: string;
  summary: string | null;
  taskCounts: TaskCounts;
  artifactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProjectsResult {
  items: ProjectListItem[];
  nextCursor: string | undefined;
}

export class ListProjectsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: ListProjectsInput): Promise<ListProjectsResult> {
    const { userId, orgId, limit, cursor, search } = input;

    // If cursor is provided, get the cursor project's createdAt for filtering
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorProject = await this.db
        .select({ createdAt: projects.createdAt })
        .from(projects)
        .where(eq(projects.id, cursor))
        .limit(1);

      if (cursorProject.length === 0) {
        return { items: [], nextCursor: undefined };
      }

      cursorDate = cursorProject[0]?.createdAt;
    }

    // Build the where conditions
    const conditions: SQL[] = [
      eq(projects.orgId, orgId),
      eq(projects.userId, userId),
    ];

    if (cursorDate) {
      conditions.push(lt(projects.createdAt, cursorDate));
    }

    // Add search filter if provided
    if (search?.trim()) {
      const searchPattern = `%${escapeLikePattern(search.trim())}%`;
      conditions.push(
        or(
          ilike(projects.title, searchPattern),
          ilike(projects.summary, searchPattern)
        )!
      );
    }

    // Get projects with task counts
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
      .where(and(...conditions))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))
      .limit(limit + 1);

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.id;
    }

    // Map to ProjectListItem
    const items: ProjectListItem[] = results.map((r) => ({
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

    return { items, nextCursor };
  }
}
