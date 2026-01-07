import { eq, asc, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

/**
 * Query to get all child sessions spawned from a parent session
 */
export class GetSessionChildrenQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string, userId: string): Promise<AgentSession[]> {
    return this.db
      .select()
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.parentSessionId, sessionId),
          eq(agentSessions.userId, userId)
        )
      )
      .orderBy(asc(agentSessions.createdAt));
  }
}
