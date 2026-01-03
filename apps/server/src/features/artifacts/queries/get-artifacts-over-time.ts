import { eq, and, gte, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { TimeRange, ArtifactsOverTimePoint } from '../types';
import { getTimeRangeStart, getGranularityForTimeRange } from './utils';

export class GetArtifactsOverTimeQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    orgId: string,
    timeRange: TimeRange
  ): Promise<ArtifactsOverTimePoint[]> {
    const startDate = getTimeRangeStart(timeRange);
    const granularity = getGranularityForTimeRange(timeRange);

    const conditions = [eq(artifacts.orgId, orgId)];
    if (startDate) {
      conditions.push(gte(artifacts.createdAt, startDate));
    }

    const results = await this.db
      .select({
        date: sql<string>`date_trunc(${granularity}, ${artifacts.createdAt})::text`,
        count: sql<number>`count(*)::int`,
        sizeBytes: sql<number>`coalesce(sum(${artifacts.sizeBytes}), 0)::int`,
      })
      .from(artifacts)
      .where(and(...conditions))
      .groupBy(sql`date_trunc(${granularity}, ${artifacts.createdAt})`)
      .orderBy(sql`date_trunc(${granularity}, ${artifacts.createdAt})`);

    return results;
  }
}
