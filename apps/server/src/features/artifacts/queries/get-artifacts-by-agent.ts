import { eq, and, gte, sql, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, localAgents } from '../../../db/schema';
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

    // Find local agent names for agentIds not in the built-in agentNames map
    const unknownAgentIds = results
      .map((r) => r.agentId)
      .filter((id): id is string => id !== null && !this.agentNames.has(id));

    const localAgentNames = new Map<string, string>();
    if (unknownAgentIds.length > 0) {
      const localAgentResults = await this.db
        .select({
          key: localAgents.key,
          name: localAgents.name,
        })
        .from(localAgents)
        .where(inArray(localAgents.key, unknownAgentIds));

      for (const la of localAgentResults) {
        localAgentNames.set(la.key, la.name);
      }
    }

    return results.map((row) => ({
      agentId: row.agentId,
      agentName: row.agentId
        ? (this.agentNames.get(row.agentId) ??
          localAgentNames.get(row.agentId) ??
          row.agentId)
        : 'Standalone',
      count: row.count,
    }));
  }
}
