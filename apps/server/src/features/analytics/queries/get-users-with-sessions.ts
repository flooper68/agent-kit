import { sql, and, gte, count, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { TimeRange } from '../types';

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
