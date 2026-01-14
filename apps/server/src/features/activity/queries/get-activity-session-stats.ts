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
  averageDurationMinutes: number;
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
    const averageDurationMinutes = Number(stats?.avgDuration) || 0;

    return {
      totalSessions,
      averageDurationMinutes: Math.round(averageDurationMinutes),
      sessionsPerDay:
        daysInRange > 0
          ? Math.round((totalSessions / daysInRange) * 10) / 10
          : 0,
    };
  }
}
