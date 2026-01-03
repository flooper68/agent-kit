import { sql, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import { getStartDate } from './utils';

export interface UserWithSessions {
  userId: string;
  sessionCount: number;
}

export interface GetUsersWithSessionsInput {
  timeRange: TimeRange;
}

export class GetUsersWithSessionsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetUsersWithSessionsInput): Promise<UserWithSessions[]> {
    const startDate = getStartDate(input.timeRange);

    const conditions = [];
    if (startDate) {
      conditions.push(gte(agentSessions.createdAt, startDate));
    }

    const results = await this.db
      .select({
        userId: agentSessions.userId,
        sessionCount: sql<number>`count(*)::integer`,
      })
      .from(agentSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(agentSessions.userId)
      .orderBy(desc(count()));

    return results.map((row) => ({
      userId: row.userId,
      sessionCount: Number(row.sessionCount),
    }));
  }
}
