import {
  eq,
  desc,
  lt,
  and,
  or,
  ilike,
  notExists,
  sql,
  type SQL,
} from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import {
  artifacts,
  artifactTags,
  projectArtifacts,
  taskArtifacts,
} from '../../../db/schema';

export interface ListArtifactsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
  excludeProjectId?: string;
  uncategorized?: boolean;
  tags?: string[];
}

export interface ArtifactListItem {
  id: string;
  title: string;
  summary: string | null;
  format: string;
  sizeBytes: number;
  tags: string[];
  projectCount: number;
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListArtifactsResult {
  items: ArtifactListItem[];
  nextCursor: string | undefined;
}

export class ListArtifactsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: ListArtifactsInput): Promise<ListArtifactsResult> {
    const {
      userId,
      orgId,
      limit,
      cursor,
      search,
      excludeProjectId,
      uncategorized,
      tags,
    } = input;

    // If cursor is provided, get the cursor artifact's createdAt for filtering
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorArtifact = await this.db
        .select({ createdAt: artifacts.createdAt })
        .from(artifacts)
        .where(eq(artifacts.id, cursor))
        .limit(1);

      // If cursor artifact was deleted, return empty results to indicate invalid cursor
      if (cursorArtifact.length === 0) {
        return { items: [], nextCursor: undefined };
      }

      cursorDate = cursorArtifact[0]?.createdAt;
    }

    // Build the where conditions
    const conditions: SQL[] = [
      eq(artifacts.orgId, orgId),
      eq(artifacts.userId, userId),
    ];

    if (cursorDate) {
      conditions.push(lt(artifacts.createdAt, cursorDate));
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

    // Exclude artifacts already attached to a specific project
    if (excludeProjectId) {
      conditions.push(
        notExists(
          this.db
            .select()
            .from(projectArtifacts)
            .where(
              and(
                eq(projectArtifacts.artifactId, artifacts.id),
                eq(projectArtifacts.projectId, excludeProjectId)
              )
            )
        )
      );
    }

    // Filter to only uncategorized artifacts (not attached to any project)
    if (uncategorized) {
      conditions.push(
        notExists(
          this.db
            .select()
            .from(projectArtifacts)
            .where(eq(projectArtifacts.artifactId, artifacts.id))
        )
      );
    }

    // Filter by tags using EXISTS subquery
    if (tags && tags.length > 0) {
      // Artifact must have ALL specified tags
      for (const tag of tags) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${artifactTags}
            WHERE ${artifactTags.artifactId} = ${artifacts.id}
            AND ${artifactTags.tag} = ${tag}
          )`
        );
      }
    }

    // Execute query
    const results = await this.db
      .select({
        id: artifacts.id,
        title: artifacts.title,
        summary: artifacts.summary,
        format: artifacts.format,
        sizeBytes: artifacts.sizeBytes,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt,
        projectCount: sql<number>`(
          SELECT count(*)::int
          FROM ${projectArtifacts}
          WHERE ${projectArtifacts.artifactId} = ${artifacts.id}
        )`,
        taskCount: sql<number>`(
          SELECT count(*)::int
          FROM ${taskArtifacts}
          WHERE ${taskArtifacts.artifactId} = ${artifacts.id}
        )`,
        tags: sql<string[]>`COALESCE(
          (SELECT array_agg(${artifactTags.tag} ORDER BY ${artifactTags.tag})
           FROM ${artifactTags}
           WHERE ${artifactTags.artifactId} = ${artifacts.id}),
          ARRAY[]::varchar[]
        )`,
      })
      .from(artifacts)
      .where(and(...conditions))
      .orderBy(desc(artifacts.createdAt))
      .limit(limit + 1);

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem?.id;
    }

    return { items: results, nextCursor };
  }
}
