import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { userActivitySessions } from '../../../db/schema';
import { DEFAULT_INACTIVITY_THRESHOLD_MINUTES } from '../types';

export interface UpdateActivitySessionMetricsInput {
  userId: string;
  orgId: string;
  costDelta: number;
  tokensDelta: number;
  inactivityThresholdMinutes?: number;
}

export type UpdateActivitySessionMetricsResult = void;

/**
 * Updates the metrics of the user's current activity session.
 * Called when an agent session completes to aggregate costs and tokens.
 */
export class UpdateActivitySessionMetricsCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateActivitySessionMetricsInput
  ): Promise<UpdateActivitySessionMetricsResult> {
    const {
      userId,
      orgId,
      costDelta,
      tokensDelta,
      inactivityThresholdMinutes = DEFAULT_INACTIVITY_THRESHOLD_MINUTES,
    } = input;

    const now = new Date();
    const thresholdTime = new Date(
      now.getTime() - inactivityThresholdMinutes * 60 * 1000
    );

    // Find the user's current active session
    const [activeSession] = await this.db
      .select({
        id: userActivitySessions.id,
      })
      .from(userActivitySessions)
      .where(
        and(
          eq(userActivitySessions.userId, userId),
          eq(userActivitySessions.orgId, orgId),
          gte(userActivitySessions.lastActivityAt, thresholdTime)
        )
      )
      .orderBy(desc(userActivitySessions.lastActivityAt))
      .limit(1);

    if (!activeSession) {
      // No active session - this shouldn't normally happen if heartbeat is working
      // but we can silently skip or create a session
      return;
    }

    // Update the session metrics
    await this.db
      .update(userActivitySessions)
      .set({
        estimatedCost: sql`COALESCE(${userActivitySessions.estimatedCost}, 0) + ${costDelta}`,
        totalTokens: sql`COALESCE(${userActivitySessions.totalTokens}, 0) + ${tokensDelta}`,
        agentSessionsCount: sql`COALESCE(${userActivitySessions.agentSessionsCount}, 0) + 1`,
        updatedAt: now,
      })
      .where(eq(userActivitySessions.id, activeSession.id));
  }
}
