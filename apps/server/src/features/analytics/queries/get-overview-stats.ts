import { sql, eq, and, gte, countDistinct, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface GetOverviewStatsInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface OverviewStats {
  totalSessions: number;
  activeUsers: number;
  totalCost: number;
  totalTokens: number;
  trends: {
    sessions: number;
    users: number;
    cost: number;
    tokens: number;
  };
}

export type GetOverviewStatsResult = OverviewStats;

function getPreviousPeriodDates(
  timeRange: TimeRange
): { start: Date; end: Date } | null {
  const now = new Date();
  switch (timeRange) {
    case 'today': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start: yesterday, end: yesterdayEnd };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 14);
      const end = new Date(now);
      end.setDate(end.getDate() - 7);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now);
      start.setDate(start.getDate() - 60);
      const end = new Date(now);
      end.setDate(end.getDate() - 30);
      return { start, end };
    }
    case 'all':
      return null;
  }
}

export class GetOverviewStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetOverviewStatsInput): Promise<GetOverviewStatsResult> {
    const startDate = getStartDate(input.timeRange);
    const previousPeriod = getPreviousPeriodDates(input.timeRange);

    // Build conditions for current period
    const currentConditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      currentConditions.push(gte(agentSessions.createdAt, startDate));
    }
    if (input.userId) {
      currentConditions.push(eq(agentSessions.userId, input.userId));
    }

    // Current period stats
    const currentStats = await this.db
      .select({
        totalSessions: count(),
        activeUsers: countDistinct(agentSessions.userId),
        totalCost: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'estimatedCost')::numeric), 0)`,
        totalTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`,
      })
      .from(agentSessions)
      .where(
        currentConditions.length > 0 ? and(...currentConditions) : undefined
      );

    const current = currentStats[0] ?? {
      totalSessions: 0,
      activeUsers: 0,
      totalCost: 0,
      totalTokens: 0,
    };

    // Previous period stats for trends
    let trends = { sessions: 0, users: 0, cost: 0, tokens: 0 };

    if (previousPeriod) {
      const previousConditions = [
        eq(agentSessions.orgId, input.orgId),
        gte(agentSessions.createdAt, previousPeriod.start),
        sql`${agentSessions.createdAt} < ${previousPeriod.end.toISOString()}`,
      ];
      if (input.userId) {
        previousConditions.push(eq(agentSessions.userId, input.userId));
      }

      const previousStats = await this.db
        .select({
          totalSessions: count(),
          activeUsers: countDistinct(agentSessions.userId),
          totalCost: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'estimatedCost')::numeric), 0)`,
          totalTokens: sql<number>`COALESCE(SUM((${agentSessions.usage}->>'totalTokens')::integer), 0)`,
        })
        .from(agentSessions)
        .where(and(...previousConditions));

      const previous = previousStats[0];
      if (previous) {
        trends = {
          sessions: this.calculateTrend(
            Number(current.totalSessions),
            Number(previous.totalSessions)
          ),
          users: this.calculateTrend(
            Number(current.activeUsers),
            Number(previous.activeUsers)
          ),
          cost: this.calculateTrend(
            Number(current.totalCost),
            Number(previous.totalCost)
          ),
          tokens: this.calculateTrend(
            Number(current.totalTokens),
            Number(previous.totalTokens)
          ),
        };
      }
    }

    return {
      totalSessions: Number(current.totalSessions),
      activeUsers: Number(current.activeUsers),
      totalCost: Number(current.totalCost),
      totalTokens: Number(current.totalTokens),
      trends,
    };
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
