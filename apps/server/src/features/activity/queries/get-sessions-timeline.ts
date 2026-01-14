import type { ClerkClient } from '@clerk/backend';
import { sql, eq, and, gte, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import type { TimeRange } from '../types';
import {
  getStartDate,
  enrichWithClerkUserInfo,
  type WithClerkUserInfo,
} from '../../shared';

export interface GetSessionsTimelineInput {
  orgId: string;
  timeRange: TimeRange;
  userId?: string;
}

export interface SessionTimelineEntry {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

export interface SessionTimelineUser {
  userId: string;
  sessions: SessionTimelineEntry[];
}

export interface GetSessionsTimelineResult {
  users: WithClerkUserInfo<SessionTimelineUser>[];
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Retrieves session data formatted for timeline visualization.
 * Groups sessions by user, ordered by time.
 */
export class GetSessionsTimelineQuery {
  private db: typeof DbType;
  private clerk: ClerkClient;

  constructor(db: typeof DbType, clerk: ClerkClient) {
    this.db = db;
    this.clerk = clerk;
  }

  async execute(
    input: GetSessionsTimelineInput
  ): Promise<GetSessionsTimelineResult> {
    const { orgId, timeRange, userId } = input;

    const startDate = getStartDate(timeRange);
    const conditions = [eq(userActivitySessions.orgId, orgId)];

    if (startDate) {
      conditions.push(gte(userActivitySessions.startedAt, startDate));
    }

    if (userId) {
      conditions.push(eq(userActivitySessions.userId, userId));
    }

    // Fetch all sessions in the time range
    const sessions = await this.db
      .select({
        id: userActivitySessions.id,
        userId: userActivitySessions.userId,
        startedAt: userActivitySessions.startedAt,
        lastActivityAt: userActivitySessions.lastActivityAt,
        endedAt: userActivitySessions.endedAt,
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
      .limit(500); // Limit total sessions to prevent performance issues

    // Group sessions by user
    const userSessionsMap = new Map<string, SessionTimelineEntry[]>();

    for (const session of sessions) {
      const entry: SessionTimelineEntry = {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        endedAt:
          session.endedAt?.toISOString() ??
          session.lastActivityAt.toISOString(),
        durationMinutes: Math.round(Number(session.durationMinutes) || 0),
      };

      const existing = userSessionsMap.get(session.userId);
      if (existing) {
        existing.push(entry);
      } else {
        userSessionsMap.set(session.userId, [entry]);
      }
    }

    // Convert to array and limit to top 10 users by session count
    const usersList = Array.from(userSessionsMap.entries())
      .map(([visitorUserId, userSessions]) => ({
        userId: visitorUserId,
        sessions: userSessions.sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        ),
      }))
      .sort((a, b) => b.sessions.length - a.sessions.length)
      .slice(0, 10);

    // Enrich with Clerk user info
    const enrichedUsers = await enrichWithClerkUserInfo(this.clerk, usersList);

    // Calculate time range boundaries
    const allSessions = sessions;
    const now = new Date();
    const rangeStart =
      startDate ??
      (allSessions.length > 0
        ? new Date(
            Math.min(...allSessions.map((s) => s.startedAt.getTime()))
          )
        : now);
    const rangeEnd = now;

    return {
      users: enrichedUsers,
      timeRange: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      },
    };
  }
}
