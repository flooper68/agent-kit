import { eq, and, gte, desc, isNull } from 'drizzle-orm';
import { userActivitySessions } from '../../../db/schema';
import { DEFAULT_INACTIVITY_THRESHOLD_MINUTES } from '../types';
import type { ActivityCommandContext } from '../context';

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
 *
 * Uses a transaction to ensure atomicity when closing old sessions and creating new ones.
 */
export class RecordHeartbeatCommand {
  async execute(
    ctx: ActivityCommandContext,
    input: RecordHeartbeatInput
  ): Promise<RecordHeartbeatResult> {
    const {
      userId,
      orgId,
      inactivityThresholdMinutes = DEFAULT_INACTIVITY_THRESHOLD_MINUTES,
    } = input;

    const { tx } = ctx;
    const now = new Date();
    const thresholdTime = new Date(
      now.getTime() - inactivityThresholdMinutes * 60 * 1000
    );

    // Find the user's most recent active session (recent activity and not ended)
    const [existingSession] = await tx
      .select({
        id: userActivitySessions.id,
        lastActivityAt: userActivitySessions.lastActivityAt,
      })
      .from(userActivitySessions)
      .where(
        and(
          eq(userActivitySessions.userId, userId),
          eq(userActivitySessions.orgId, orgId),
          // Session is still "active" (recent activity)
          gte(userActivitySessions.lastActivityAt, thresholdTime),
          // Session has not been explicitly ended
          isNull(userActivitySessions.endedAt)
        )
      )
      .orderBy(desc(userActivitySessions.lastActivityAt))
      .limit(1);

    if (existingSession) {
      // Update existing session's last activity
      await tx
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

    // Close any previous open sessions for this user
    await tx
      .update(userActivitySessions)
      .set({
        endedAt: thresholdTime, // Use threshold time as approximate end
        updatedAt: now,
      })
      .where(
        and(
          eq(userActivitySessions.userId, userId),
          eq(userActivitySessions.orgId, orgId),
          isNull(userActivitySessions.endedAt)
        )
      );

    // Create a new activity session
    const [newSession] = await tx
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
