import { sql, eq, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange, AnalyticsFilters } from '../types';

function getStartDate(timeRange: TimeRange): Date | null {
  const now = new Date();
  switch (timeRange) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setDate(now.getDate() - 30));
    case 'all':
      return null;
  }
}

export interface TokensPerUserItem {
  userId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  sessions: number;
}

export class GetTokensPerUserQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(filters: AnalyticsFilters): Promise<TokensPerUserItem[]> {
    const startDate = getStartDate(filters.timeRange);

    const conditions = [sql`${agentSessions.usage} IS NOT NULL`];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (filters.userId) {
      conditions.push(eq(agentSessions.userId, filters.userId));
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
