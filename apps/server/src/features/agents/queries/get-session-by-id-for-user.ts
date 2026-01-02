import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { AgentSession } from '../types';

export class GetSessionByIdForUserQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    sessionId: string,
    userId: string
  ): Promise<AgentSession | undefined> {
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(
        and(eq(agentSessions.id, sessionId), eq(agentSessions.userId, userId))
      );

    return session;
  }
}
