import { sql, eq, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface GetUsersWithSessionsInput {
  orgId: string;
  timeRange: TimeRange;
}

export interface UserWithSessions {
  userId: string;
  sessionCount: number;
}

export type GetUsersWithSessionsResult = UserWithSessions[];

export class GetUsersWithSessionsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetUsersWithSessionsInput
  ): Promise<GetUsersWithSessionsResult> {
    const startDate = getStartDate(input.timeRange);

    // Build conditions - always filter by orgId
    const conditions = [eq(agentSessions.orgId, input.orgId)];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }

    const results = await this.db
      .select({
        userId: agentSessions.userId,
        sessionCount: sql<number>`count(*)::integer`,
      })
      .from(agentSessions)
      .where(and(...conditions))
      .groupBy(agentSessions.userId)
      .orderBy(desc(count()));

    return results.map((row) => ({
      userId: row.userId,
      sessionCount: Number(row.sessionCount),
    }));
  }
}
