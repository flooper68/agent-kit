import { eq, and, gte, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getTimeRangeStart, getGranularityForTimeRange } from './utils';

export interface GetArtifactsOverTimeInput {
  orgId: string;
  timeRange: TimeRange;
}

export interface ArtifactsOverTimePoint {
  date: string;
  count: number;
  sizeBytes: number;
}

export type GetArtifactsOverTimeResult = ArtifactsOverTimePoint[];

const VALID_GRANULARITIES = ['hour', 'day', 'week'] as const;

export class GetArtifactsOverTimeQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetArtifactsOverTimeInput): Promise<GetArtifactsOverTimeResult> {
    const { orgId, timeRange } = input;
    const startDate = getTimeRangeStart(timeRange);
    const granularity = getGranularityForTimeRange(timeRange);

    // Validate granularity to prevent SQL injection
    if (
      !VALID_GRANULARITIES.includes(
        granularity as (typeof VALID_GRANULARITIES)[number]
      )
    ) {
      throw new Error(`Invalid granularity: ${granularity}`);
    }

    const conditions = [eq(artifacts.orgId, orgId)];
    if (startDate) {
      conditions.push(gte(artifacts.createdAt, startDate));
    }

    // Build the date_trunc expression with literal granularity (already validated above)
    const dateTruncExpr = sql.raw(
      `date_trunc('${granularity}', "artifacts"."created_at")`
    );

    const results = await this.db
      .select({
        date: sql<string>`${dateTruncExpr}::text`,
        count: sql<number>`count(*)::int`,
        sizeBytes: sql<number>`coalesce(sum(${artifacts.sizeBytes}), 0)::int`,
      })
      .from(artifacts)
      .where(and(...conditions))
      .groupBy(dateTruncExpr)
      .orderBy(dateTruncExpr);

    return results;
  }
}
