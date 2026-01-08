import { sql, eq, and, gte, sum, count, desc, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  externalAgents,
  serverAgents,
} from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface GetAgentDistributionInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface AgentDistributionItem {
  agentId: string;
  agentName: string;
  sessions: number;
  messages: number;
  cost: number;
}

export type GetAgentDistributionResult = AgentDistributionItem[];

export interface GetProviderDistributionInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface ProviderDistributionItem {
  provider: string;
  sessions: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

export type GetProviderDistributionResult = ProviderDistributionItem[];

export class GetAgentDistributionQuery {
  private db: typeof DbType;
  private agentNames: Map<string, string>;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.db = db;
    this.agentNames = agentNames;
  }

  async execute(
    input: GetAgentDistributionInput
  ): Promise<GetAgentDistributionResult> {
    const startDate = getStartDate(input.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
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

    // Find local agent names for agentIds not in the built-in agentNames map
    // These are local agent keys that need name resolution
    const unknownAgentIds = results
      .map((r) => r.agentId)
      .filter((id) => !this.agentNames.has(id));

    const localAgentNames = new Map<string, string>();
    if (unknownAgentIds.length > 0) {
      // Look up agents by key from both tables to get their display names
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
      agentName:
        this.agentNames.get(row.agentId) ??
        localAgentNames.get(row.agentId) ??
        row.agentId,
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
    input: GetProviderDistributionInput
  ): Promise<GetProviderDistributionResult> {
    const startDate = getStartDate(input.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [
      eq(agentSessions.orgId, input.orgId),
      sql`${agentSessions.usage} IS NOT NULL`,
    ];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    const providerField = sql<string>`${agentSessions.usage}->>'lastProvider'`;

    const results = await this.db
      .select({
        provider: providerField,
        sessions: count(),
        tokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`,
        promptTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'promptTokens')::integer), 0)`,
        completionTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'completionTokens')::integer), 0)`,
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
        promptTokens: Number(row.promptTokens),
        completionTokens: Number(row.completionTokens),
        cost: Number(row.cost),
      }));
  }
}
