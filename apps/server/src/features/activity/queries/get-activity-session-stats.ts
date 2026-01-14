import { sql, eq, and, gte, count } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate, getDaysInRange } from '../../shared';

export interface GetActivitySessionStatsInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface ActivitySessionStats {
  totalSessions: number;
  totalCost: number;
  totalTokens: number;
  averageDurationMinutes: number;
  averageCostPerSession: number;
  averageTokensPerSession: number;
  sessionsPerDay: number;
}

export type GetActivitySessionStatsResult = ActivitySessionStats;

/**
 * Retrieves aggregated statistics for activity sessions.
 */
export class GetActivitySessionStatsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetActivitySessionStatsInput
  ): Promise<GetActivitySessionStatsResult> {
    const { orgId, timeRange, userId } = input;

    const startDate = getStartDate(timeRange);
    const daysInRange = getDaysInRange(timeRange);
    const conditions = [eq(userActivitySessions.orgId, orgId)];

    if (startDate) {
      conditions.push(gte(userActivitySessions.startedAt, startDate));
    }

    if (userId) {
      conditions.push(eq(userActivitySessions.userId, userId));
    }

    const [stats] = await this.db
      .select({
        totalSessions: count(),
        totalCost: sql<number>`COALESCE(SUM(${userActivitySessions.estimatedCost}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${userActivitySessions.totalTokens}), 0)`,
        avgDuration: sql<number>`
          COALESCE(AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(${userActivitySessions.endedAt}, ${userActivitySessions.lastActivityAt})
              - ${userActivitySessions.startedAt}
            )) / 60
          ), 0)
        `,
      })
      .from(userActivitySessions)
      .where(and(...conditions));

    const totalSessions = Number(stats?.totalSessions) || 0;
    const totalCost = Number(stats?.totalCost) || 0;
    const totalTokens = Number(stats?.totalTokens) || 0;
    const averageDurationMinutes = Number(stats?.avgDuration) || 0;

    return {
      totalSessions,
      totalCost,
      totalTokens,
      averageDurationMinutes: Math.round(averageDurationMinutes),
      averageCostPerSession:
        totalSessions > 0 ? totalCost / totalSessions : 0,
      averageTokensPerSession:
        totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
      sessionsPerDay:
        daysInRange > 0
          ? Math.round((totalSessions / daysInRange) * 10) / 10
          : 0,
    };
  }
}
