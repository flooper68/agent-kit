import { sql, eq, and, gte, sum, count, type SQL } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type {
  TimeRange,
  Granularity,
  UsageOverTimePoint,
  AnalyticsFilters,
} from '../types';
import { getStartDate as getStartDateBase } from './utils';

/**
 * Returns the DATE_TRUNC SQL fragment for the given granularity.
 * Uses explicit case mapping instead of sql.raw() to prevent SQL injection.
 */
function getDateTruncSql(granularity: Granularity): SQL<string> {
  switch (granularity) {
    case 'hour':
      return sql<string>`DATE_TRUNC('hour', ${agentSessions.createdAt})`;
    case 'day':
      return sql<string>`DATE_TRUNC('day', ${agentSessions.createdAt})`;
    case 'week':
      return sql<string>`DATE_TRUNC('week', ${agentSessions.createdAt})`;
  }
}

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

    // Build conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      conditions.push(eq(agentSessions.userId, input.userId));
    }

    // Use explicit SQL fragments to prevent SQL injection
    const dateTrunc = getDateTruncSql(granularity);

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
