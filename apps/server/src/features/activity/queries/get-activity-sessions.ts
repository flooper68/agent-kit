import { sql, eq, and, gte, desc, lt } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import type { TimeRange } from '../types';

export interface GetActivitySessionsInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
  limit?: number;
  cursor?: string;
}

export interface ActivitySessionItem {
  id: string;
  userId: string;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
  durationMinutes: number;
  estimatedCost: number;
  totalTokens: number;
  agentSessionsCount: number;
}

export interface GetActivitySessionsResult {
  items: ActivitySessionItem[];
  nextCursor: string | undefined;
}

function getStartDate(timeRange: TimeRange): Date | null {
  const now = new Date();
  switch (timeRange) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

/**
 * Retrieves a paginated list of activity sessions for analytics.
 */
export class GetActivitySessionsQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetActivitySessionsInput
  ): Promise<GetActivitySessionsResult> {
    const { orgId, timeRange, userId, limit = 25, cursor } = input;

    const startDate = getStartDate(timeRange);
    const conditions = [eq(userActivitySessions.orgId, orgId)];

    if (startDate) {
      conditions.push(gte(userActivitySessions.startedAt, startDate));
    }

    if (userId) {
      conditions.push(eq(userActivitySessions.userId, userId));
    }

    // Cursor-based pagination (cursor is the startedAt ISO string)
    if (cursor) {
      conditions.push(lt(userActivitySessions.startedAt, new Date(cursor)));
    }

    const sessions = await this.db
      .select({
        id: userActivitySessions.id,
        userId: userActivitySessions.userId,
        startedAt: userActivitySessions.startedAt,
        lastActivityAt: userActivitySessions.lastActivityAt,
        endedAt: userActivitySessions.endedAt,
        estimatedCost: userActivitySessions.estimatedCost,
        totalTokens: userActivitySessions.totalTokens,
        agentSessionsCount: userActivitySessions.agentSessionsCount,
        // Calculate duration in minutes
        durationMinutes: sql<number>`
          EXTRACT(EPOCH FROM (
            COALESCE(${userActivitySessions.endedAt}, ${userActivitySessions.lastActivityAt})
            - ${userActivitySessions.startedAt}
          )) / 60
        `.as('duration_minutes'),
      })
      .from(userActivitySessions)
      .where(and(...conditions))
      .orderBy(desc(userActivitySessions.startedAt))
      .limit(limit + 1); // Fetch one extra to check for next page

    const hasNextPage = sessions.length > limit;
    const items = sessions.slice(0, limit).map((session) => ({
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      durationMinutes: Math.round(Number(session.durationMinutes) || 0),
      estimatedCost: Number(session.estimatedCost) || 0,
      totalTokens: session.totalTokens || 0,
      agentSessionsCount: session.agentSessionsCount || 0,
    }));

    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNextPage && lastItem ? lastItem.startedAt : undefined,
    };
  }
}
