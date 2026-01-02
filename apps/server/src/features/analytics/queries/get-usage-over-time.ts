import { sql, eq, and, gte, sum, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type {
  TimeRange,
  Granularity,
  UsageOverTimePoint,
  AnalyticsFilters,
} from '../types';

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
      // Default to 90 days for "all" to avoid massive queries
      return new Date(now.setDate(now.getDate() - 90));
  }
}

function getDefaultGranularity(timeRange: TimeRange): Granularity {
  switch (timeRange) {
    case 'today':
      return 'hour';
    case 'week':
      return 'day';
    case 'month':
    case 'all':
      return 'day';
  }
}

export interface GetUsageOverTimeInput extends AnalyticsFilters {
  granularity?: Granularity;
}

export class GetUsageOverTimeQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetUsageOverTimeInput): Promise<UsageOverTimePoint[]> {
    const startDate = getStartDate(input.timeRange);
    const granularity =
      input.granularity ?? getDefaultGranularity(input.timeRange);

    // Build conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    const dateTrunc = sql<string>`DATE_TRUNC('${sql.raw(granularity)}', ${agentSessions.createdAt})`;

    const results = await this.db
      .select({
        date: dateTrunc,
        sessions: count(),
        messages: sum(agentSessions.messageCount),
        cost: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'estimatedCost')::numeric), 0)`,
      })
      .from(agentSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(dateTrunc)
      .orderBy(dateTrunc);

    return results.map((row) => ({
      date: new Date(row.date).toISOString(),
      sessions: Number(row.sessions),
      messages: Number(row.messages ?? 0),
      cost: Number(row.cost),
    }));
  }
}
