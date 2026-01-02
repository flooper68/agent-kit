import { eq, sql } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';

export interface IncrementMessageCountResult {
  sessionId: string;
  messageCount: number;
}

export class IncrementMessageCountCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  /**
   * Atomically increment message count and return new value
   */
  async execute(
    sessionId: string
  ): Promise<IncrementMessageCountResult | undefined> {
    const [result] = await this.db
      .update(agentSessions)
      .set({
        messageCount: sql`${agentSessions.messageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(agentSessions.id, sessionId))
      .returning({
        sessionId: agentSessions.id,
        messageCount: agentSessions.messageCount,
      });

    return result;
  }
}
