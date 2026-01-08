import { sql, eq, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface GetTokensPerUserInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface TokensPerUserItem {
  userId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  sessions: number;
}

export type GetTokensPerUserResult = TokensPerUserItem[];

export class GetTokensPerUserQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetTokensPerUserInput): Promise<GetTokensPerUserResult> {
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

    const results = await this.db
      .select({
        userId: agentSessions.userId,
        sessions: count(),
        totalTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`,
        promptTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'promptTokens')::integer), 0)`,
        completionTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'completionTokens')::integer), 0)`,
      })
      .from(agentSessions)
      .where(and(...conditions))
      .groupBy(agentSessions.userId)
      .orderBy(
        desc(
          sql`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`
        )
      )
      .limit(10);

    return results.map((row) => ({
      userId: row.userId,
      sessions: Number(row.sessions),
      totalTokens: Number(row.totalTokens),
      promptTokens: Number(row.promptTokens),
      completionTokens: Number(row.completionTokens),
    }));
  }
}
