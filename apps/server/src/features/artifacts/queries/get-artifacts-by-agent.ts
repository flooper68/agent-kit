import { eq, and, gte, sql, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, externalAgents, serverAgents } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getTimeRangeStart } from './utils';

export interface GetArtifactsByAgentInput {
  orgId: string;
  timeRange: TimeRange;
}

export interface ArtifactsByAgent {
  agentId: string | null;
  agentName: string;
  count: number;
}

export type GetArtifactsByAgentResult = ArtifactsByAgent[];

export class GetArtifactsByAgentQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(input: GetArtifactsByAgentInput): Promise<GetArtifactsByAgentResult> {
    const { orgId, timeRange } = input;
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
      // Look up agents by key from both tables
      const [externalResults, serverResults] = await Promise.all([
        this.db
          .select({
            key: externalAgents.key,
            name: externalAgents.name,
          })
          .from(externalAgents)
          .where(inArray(externalAgents.key, unknownAgentIds)),
        this.db
          .select({
            key: serverAgents.key,
            name: serverAgents.name,
          })
          .from(serverAgents)
          .where(inArray(serverAgents.key, unknownAgentIds)),
      ]);

      for (const la of [...externalResults, ...serverResults]) {
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
