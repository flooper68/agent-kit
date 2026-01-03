import { sql, eq, and, gte, sum, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type {
  AgentDistributionItem,
  ProviderDistributionItem,
  AnalyticsFilters,
} from '../types';
import { getStartDate } from './utils';

export class GetAgentDistributionQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(filters: AnalyticsFilters): Promise<AgentDistributionItem[]> {
    const startDate = getStartDate(filters.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, filters.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (filters.userId) {
      conditions.push(eq(agentSessions.userId, filters.userId));
    }

    const results = await this.db
      .select({
        agentId: agentSessions.agentId,
        sessions: count(),
        messages: sum(agentSessions.messageCount),
        cost: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'estimatedCost')::numeric), 0)`,
      })
      .from(agentSessions)
      .where(and(...conditions))
      .groupBy(agentSessions.agentId)
      .orderBy(desc(count()))
      .limit(10);

    return results.map((row) => ({
      agentId: row.agentId,
      agentName: this.agentNames.get(row.agentId) ?? row.agentId,
      sessions: Number(row.sessions),
      messages: Number(row.messages ?? 0),
      cost: Number(row.cost),
    }));
  }
}

export class GetProviderDistributionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    filters: AnalyticsFilters
  ): Promise<ProviderDistributionItem[]> {
    const startDate = getStartDate(filters.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [
      eq(agentSessions.orgId, filters.orgId),
      sql`${agentSessions.usage} IS NOT NULL`,
    ];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (filters.userId) {
      conditions.push(eq(agentSessions.userId, filters.userId));
    }

    const providerField = sql<string>`${agentSessions.usage}->>'lastProvider'`;

    const results = await this.db
      .select({
        provider: providerField,
        sessions: count(),
        tokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`,
        cost: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'estimatedCost')::numeric), 0)`,
      })
      .from(agentSessions)
      .where(and(...conditions))
      .groupBy(providerField)
      .orderBy(desc(count()));

    return results
      .filter((row) => row.provider !== null)
      .map((row) => ({
        provider: row.provider ?? 'unknown',
        sessions: Number(row.sessions),
        tokens: Number(row.tokens),
        cost: Number(row.cost),
      }));
  }
}
