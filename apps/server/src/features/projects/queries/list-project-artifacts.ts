import { eq, desc, lt, and, or, ilike, sql, type SQL } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import {
  projects,
  projectArtifacts,
  artifacts,
  artifactTags,
} from '../../../db/schema';

export interface ListProjectArtifactsInput {
  projectId: string;
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
  tags?: string[];
}

export interface ProjectArtifactListItem {
  id: string;
  title: string;
  summary: string | null;
  format: string;
  sizeBytes: number;
  tags: string[];
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
    const { projectId, userId, orgId, limit, cursor, search, tags } = input;

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

    // Build shared filter conditions (used by both main query and count query)
    const buildFilterConditions = (): SQL[] => {
      const filterConditions: SQL[] = [
        eq(projectArtifacts.projectId, projectId),
      ];

      // Add search filter if provided
      if (search?.trim()) {
        const searchPattern = `%${escapeLikePattern(search.trim())}%`;
        const searchCondition = or(
          ilike(artifacts.title, searchPattern),
          ilike(artifacts.summary, searchPattern)
        );
        if (searchCondition) {
          filterConditions.push(searchCondition);
        }
      }

      // Add tags filter if provided
      if (tags && tags.length > 0) {
        // Artifact must have ALL specified tags
        for (const tag of tags) {
          filterConditions.push(
            sql`EXISTS (
              SELECT 1 FROM ${artifactTags}
              WHERE ${artifactTags.artifactId} = ${artifacts.id}
              AND ${artifactTags.tag} = ${tag}
            )`
          );
        }
      }

      return filterConditions;
    };

    // Build conditions for main query (includes cursor pagination)
    const conditions: SQL[] = buildFilterConditions();

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
        tags: sql<string[]>`COALESCE(
          (SELECT array_agg(${artifactTags.tag} ORDER BY ${artifactTags.tag})
           FROM ${artifactTags}
           WHERE ${artifactTags.artifactId} = ${artifacts.id}),
          ARRAY[]::varchar[]
        )`,
      })
      .from(projectArtifacts)
      .innerJoin(artifacts, eq(projectArtifacts.artifactId, artifacts.id))
      .where(and(...conditions))
      .orderBy(desc(projectArtifacts.createdAt))
      .limit(limit + 1);

    // Get total count using shared filter conditions (without cursor)
    const countConditions = buildFilterConditions();
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
        tags: r.tags,
        createdAt: r.createdAt,
        attachedAt: r.attachedAt,
      })),
      nextCursor,
      total: countResult?.count ?? 0,
    };
  }
}
