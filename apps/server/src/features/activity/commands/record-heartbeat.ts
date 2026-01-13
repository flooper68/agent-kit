import { eq, and, gte, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import { DEFAULT_INACTIVITY_THRESHOLD_MINUTES } from '../types';

export interface RecordHeartbeatInput {
  userId: string;
  orgId: string;
  inactivityThresholdMinutes?: number;
}

export interface RecordHeartbeatResult {
  sessionId: string;
  isNewSession: boolean;
}

/**
 * Records a heartbeat for user activity tracking.
 * Creates a new activity session if the user has been inactive for longer than the threshold,
 * or updates the existing session's lastActivityAt timestamp.
 */
export class RecordHeartbeatCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: RecordHeartbeatInput): Promise<RecordHeartbeatResult> {
    const {
      userId,
      orgId,
      inactivityThresholdMinutes = DEFAULT_INACTIVITY_THRESHOLD_MINUTES,
    } = input;

    const now = new Date();
    const thresholdTime = new Date(
      now.getTime() - inactivityThresholdMinutes * 60 * 1000
    );

    // Find the user's most recent activity session
    const [existingSession] = await this.db
      .select({
        id: userActivitySessions.id,
        lastActivityAt: userActivitySessions.lastActivityAt,
      })
      .from(userActivitySessions)
      .where(
        and(
          eq(userActivitySessions.userId, userId),
          eq(userActivitySessions.orgId, orgId),
          // Session is still "active" (no endedAt or recent activity)
          gte(userActivitySessions.lastActivityAt, thresholdTime)
        )
      )
      .orderBy(desc(userActivitySessions.lastActivityAt))
      .limit(1);

    if (existingSession) {
      // Update existing session's last activity
      await this.db
        .update(userActivitySessions)
        .set({
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(eq(userActivitySessions.id, existingSession.id));

      return {
        sessionId: existingSession.id,
        isNewSession: false,
      };
    }

    // Close any previous sessions that don't have an endedAt yet
    await this.db
      .update(userActivitySessions)
      .set({
        endedAt: thresholdTime, // Use threshold time as approximate end
        updatedAt: now,
      })
      .where(
        and(
          eq(userActivitySessions.userId, userId),
          eq(userActivitySessions.orgId, orgId)
        )
      );

    // Create a new activity session
    const [newSession] = await this.db
      .insert(userActivitySessions)
      .values({
        userId,
        orgId,
        startedAt: now,
        lastActivityAt: now,
      })
      .returning({ id: userActivitySessions.id });

    if (!newSession) {
      throw new Error('Failed to create activity session');
    }

    return {
      sessionId: newSession.id,
      isNewSession: true,
    };
  }
}
