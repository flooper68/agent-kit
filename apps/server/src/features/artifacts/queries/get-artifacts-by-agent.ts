import { eq, and, gte, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts } from '../../../db/schema';
import type { TimeRange, ArtifactsByAgent } from '../types';
import { getTimeRangeStart } from './utils';

export class GetArtifactsByAgentQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(
    orgId: string,
    timeRange: TimeRange
  ): Promise<ArtifactsByAgent[]> {
    const startDate = getTimeRangeStart(timeRange);

    const conditions = [eq(artifacts.orgId, orgId)];
    if (startDate) {
      conditions.push(gte(artifacts.createdAt, startDate));
    }

    const results = await this.db
      .select({
        agentId: artifacts.agentId,
        count: sql<number>`count(*)::int`,
      })
      .from(artifacts)
      .where(and(...conditions))
      .groupBy(artifacts.agentId)
      .orderBy(sql`count(*) desc`);

    return results.map((row) => ({
      agentId: row.agentId,
      agentName: row.agentId
        ? (this.agentNames.get(row.agentId) ?? row.agentId)
        : 'Standalone',
      count: row.count,
    }));
  }
}
