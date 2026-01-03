import { eq, or, ilike, and, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { SearchArtifactsInput, ArtifactListItem } from '../types';

export class SearchArtifactsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: SearchArtifactsInput): Promise<ArtifactListItem[]> {
    const { userId, orgId, query, limit } = input;
    const searchPattern = `%${query}%`;

    const results = await this.db
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
      .where(
        and(
          eq(artifacts.orgId, orgId),
          eq(artifacts.userId, userId),
          or(
            ilike(artifacts.title, searchPattern),
            ilike(artifacts.summary, searchPattern)
          )
        )
      )
      .orderBy(desc(artifacts.createdAt))
      .limit(limit);

    return results;
  }
}
