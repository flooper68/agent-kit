import { eq, desc, lt, and, or, ilike, sql, type SQL } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { projects, projectArtifacts, artifacts } from '../../../db/schema';

export interface ListProjectArtifactsInput {
  projectId: string;
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface ProjectArtifactListItem {
  id: string;
  title: string;
  summary: string | null;
  format: string;
  sizeBytes: number;
  createdAt: Date;
  attachedAt: Date;
}

export interface ListProjectArtifactsResult {
  items: ProjectArtifactListItem[];
  nextCursor: string | undefined;
  total: number;
}

export class ListProjectArtifactsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: ListProjectArtifactsInput
  ): Promise<ListProjectArtifactsResult> {
    const { projectId, userId, orgId, limit, cursor, search } = input;

    // Verify project access
    const [project] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userId),
          eq(projects.orgId, orgId)
        )
      )
      .limit(1);

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Build conditions
    const conditions: SQL[] = [eq(projectArtifacts.projectId, projectId)];

    // If cursor is provided, get the cursor attachment's createdAt for filtering
    if (cursor) {
      const [cursorArtifact] = await this.db
        .select({ attachedAt: projectArtifacts.createdAt })
        .from(projectArtifacts)
        .innerJoin(artifacts, eq(projectArtifacts.artifactId, artifacts.id))
        .where(
          and(
            eq(projectArtifacts.projectId, projectId),
            eq(artifacts.id, cursor)
          )
        )
        .limit(1);

      if (cursorArtifact) {
        conditions.push(
          lt(projectArtifacts.createdAt, cursorArtifact.attachedAt)
        );
      }
    }

    // Add search filter if provided
    if (search?.trim()) {
      const searchPattern = `%${escapeLikePattern(search.trim())}%`;
      conditions.push(
        or(
          ilike(artifacts.title, searchPattern),
          ilike(artifacts.summary, searchPattern)
        )!
      );
    }

    // Execute query with join
    const results = await this.db
      .select({
        id: artifacts.id,
        title: artifacts.title,
        summary: artifacts.summary,
        format: artifacts.format,
        sizeBytes: artifacts.sizeBytes,
        createdAt: artifacts.createdAt,
        attachedAt: projectArtifacts.createdAt,
      })
      .from(projectArtifacts)
      .innerJoin(artifacts, eq(projectArtifacts.artifactId, artifacts.id))
      .where(and(...conditions))
      .orderBy(desc(projectArtifacts.createdAt))
      .limit(limit + 1);

    // Build count conditions (same as main query but without cursor)
    const countConditions: SQL[] = [eq(projectArtifacts.projectId, projectId)];

    if (search?.trim()) {
      const searchPattern = `%${escapeLikePattern(search.trim())}%`;
      countConditions.push(
        or(
          ilike(artifacts.title, searchPattern),
          ilike(artifacts.summary, searchPattern)
        )!
      );
    }

    // Get total count with search filter applied
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectArtifacts)
      .innerJoin(artifacts, eq(projectArtifacts.artifactId, artifacts.id))
      .where(and(...countConditions));

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items: results.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        format: r.format,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
        attachedAt: r.attachedAt,
      })),
      nextCursor,
      total: countResult?.count ?? 0,
    };
  }
}
