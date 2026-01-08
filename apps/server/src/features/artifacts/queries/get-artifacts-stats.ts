import { eq, and, gte, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getTimeRangeStart } from './utils';

export interface GetArtifactsStatsInput {
  orgId: string;
  timeRange: TimeRange;
}

export interface GetArtifactsStatsResult {
  totalCount: number;
  totalSizeBytes: number;
}

export class GetArtifactsStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetArtifactsStatsInput): Promise<GetArtifactsStatsResult> {
    const { orgId, timeRange } = input;
    const startDate = getTimeRangeStart(timeRange);

    const conditions = [eq(artifacts.orgId, orgId)];
    if (startDate) {
      conditions.push(gte(artifacts.createdAt, startDate));
    }

    const [result] = await this.db
      .select({
        totalCount: sql<number>`count(*)::int`,
        totalSizeBytes: sql<number>`coalesce(sum(${artifacts.sizeBytes}), 0)::int`,
      })
      .from(artifacts)
      .where(and(...conditions));

    return {
      totalCount: result?.totalCount ?? 0,
      totalSizeBytes: result?.totalSizeBytes ?? 0,
    };
  }
}
