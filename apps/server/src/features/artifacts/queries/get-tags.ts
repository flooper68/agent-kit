import { sql } from 'drizzle-orm';
import { escapeLikePattern } from '../../../lib/db/escape-like';
import type { db as DbType } from '../../../db';
import { artifacts, artifactTags } from '../../../db/schema';

export interface GetTagsInput {
  orgId: string;
  search?: string;
  limit?: number;
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export type GetTagsResult = TagWithCount[];

export class GetTagsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetTagsInput): Promise<GetTagsResult> {
    const { orgId, search, limit = 50 } = input;

    try {
      // Query from artifact_tags joined with artifacts for org filtering
      const query = sql`
        SELECT
          ${artifactTags.tag} as tag,
          COUNT(*)::int as count
        FROM ${artifactTags}
        INNER JOIN ${artifacts} ON ${artifactTags.artifactId} = ${artifacts.id}
        WHERE ${artifacts.orgId} = ${orgId}
        ${search ? sql`AND ${artifactTags.tag} ILIKE ${'%' + escapeLikePattern(search) + '%'}` : sql``}
        GROUP BY ${artifactTags.tag}
        ORDER BY count DESC, tag ASC
        LIMIT ${limit}
      `;

      const results = await this.db.execute(query);

      // Validate and map results
      if (!Array.isArray(results)) {
        return [];
      }

      return results
        .filter(
          (row): row is { tag: string; count: number } =>
            typeof row === 'object' &&
            row !== null &&
            typeof (row as Record<string, unknown>).tag === 'string' &&
            typeof (row as Record<string, unknown>).count === 'number'
        )
        .map((row) => ({
          tag: row.tag,
          count: row.count,
        }));
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      throw new Error('Failed to retrieve tags');
    }
  }
}
