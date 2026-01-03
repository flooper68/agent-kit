import { eq, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionEvents, agentSessions } from '../../../db/schema';
import type { AnalyticsFilters } from '../types';
import { getStartDate } from './utils';

export interface WebSearchCallsPerUserItem {
  userId: string;
  callCount: number;
}

export class GetWebSearchCallsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    filters: AnalyticsFilters
  ): Promise<WebSearchCallsPerUserItem[]> {
    const startDate = getStartDate(filters.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [
      eq(agentSessions.orgId, filters.orgId),
      eq(agentSessionEvents.type, 'tool_call'),
      eq(agentSessionEvents.toolName, 'webSearch'),
    ];
    if (startDate) {
      conditions.push(gte(agentSessionEvents.createdAt, startDate));
    }
    if (filters.userId) {
      conditions.push(eq(agentSessions.userId, filters.userId));
    }

    const results = await this.db
      .select({
        userId: agentSessions.userId,
        callCount: count(),
      })
      .from(agentSessionEvents)
      .innerJoin(
        agentSessions,
        eq(agentSessionEvents.sessionId, agentSessions.id)
      )
      .where(and(...conditions))
      .groupBy(agentSessions.userId)
      .orderBy(desc(count()))
      .limit(10);

    return results.map((row) => ({
      userId: row.userId,
      callCount: Number(row.callCount),
    }));
  }
}
