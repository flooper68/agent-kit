import { sql, eq, and, gte, sum, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type {
  TimeRange,
  Granularity,
  UsageOverTimePoint,
  AnalyticsFilters,
} from '../types';
import { getStartDate as getStartDateBase } from './utils';

function getStartDate(timeRange: TimeRange): Date | null {
  // For usage over time, limit 'all' to 90 days to avoid massive queries
  if (timeRange === 'all') {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  }
  return getStartDateBase(timeRange);
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

    // Defense in depth - validate granularity even if schema should have caught it
    const validGranularities = ['hour', 'day', 'week'] as const;
    if (!validGranularities.includes(granularity)) {
      throw new Error(`Invalid granularity: ${granularity}`);
    }

    // Build conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, input.orgId)];
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
      .where(and(...conditions))
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
