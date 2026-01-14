import { eq, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionEvents, agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface GetWebSearchCallsInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface WebSearchCallsPerUserItem {
  userId: string;
  callCount: number;
}

export type GetWebSearchCallsResult = WebSearchCallsPerUserItem[];

export class GetWebSearchCallsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetWebSearchCallsInput
  ): Promise<GetWebSearchCallsResult> {
    const startDate = getStartDate(input.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [
      eq(agentSessions.orgId, input.orgId),
      eq(agentSessionEvents.type, 'tool_call'),
      eq(agentSessionEvents.toolName, 'webSearch'),
    ];
    if (startDate) {
      // Filter on session creation date for consistency with other analytics queries
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
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
