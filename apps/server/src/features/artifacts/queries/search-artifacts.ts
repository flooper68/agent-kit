import { eq, or, ilike, and, desc, sql } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { SearchArtifactsInput, SearchArtifactsResult } from '../types';

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
      query.trim() === ''
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
