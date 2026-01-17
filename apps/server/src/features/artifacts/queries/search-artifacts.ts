import { eq, or, ilike, and, desc, sql } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { artifacts, projectArtifacts, taskArtifacts } from '../../../db/schema';
import type { ArtifactListItem } from './list-artifacts';

export interface SearchArtifactsInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
  offset: number;
}

export interface SearchArtifactsResult {
  results: ArtifactListItem[];
  totalCount: number;
}

export class SearchArtifactsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: SearchArtifactsInput): Promise<SearchArtifactsResult> {
    const { userId, orgId, query, limit, offset } = input;

    const baseCondition = and(
      eq(artifacts.orgId, orgId),
      eq(artifacts.userId, userId)
    );

    const searchCondition =
      query === '*' || query.trim() === ''
        ? baseCondition
        : and(
            baseCondition,
            or(
              ilike(artifacts.title, `%${escapeLikePattern(query.trim())}%`),
              ilike(artifacts.summary, `%${escapeLikePattern(query.trim())}%`)
            )
          );

    const [results, countResult] = await Promise.all([
      this.db
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
        })
        .from(artifacts)
        .where(searchCondition)
        .orderBy(desc(artifacts.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(artifacts)
        .where(searchCondition),
    ]);

    return {
      results,
      totalCount: countResult[0]?.count ?? 0,
    };
  }
}
