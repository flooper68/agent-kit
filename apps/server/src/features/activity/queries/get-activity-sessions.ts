import type { ClerkClient } from '@clerk/backend';
import { sql, eq, and, gte, desc, lt } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import {
  getStartDate,
  enrichWithClerkUserInfo,
  type WithClerkUserInfo,
} from '../../shared';

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
}

export interface GetActivitySessionsResult {
  items: WithClerkUserInfo<ActivitySessionItem>[];
  nextCursor: string | undefined;
}

/**
 * Retrieves a paginated list of activity sessions for analytics.
 */
export class GetActivitySessionsQuery {
  private db: typeof DbType;
  private clerk: ClerkClient;

  constructor(db: typeof DbType, clerk: ClerkClient) {
    this.db = db;
    this.clerk = clerk;
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
    }));

    const lastItem = items[items.length - 1];
    const enrichedItems = await enrichWithClerkUserInfo(this.clerk, items);

    return {
      items: enrichedItems,
      nextCursor: hasNextPage && lastItem ? lastItem.startedAt : undefined,
    };
  }
}
