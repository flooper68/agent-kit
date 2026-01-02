import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { AgentSession } from '../types';

export class GetSessionByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<AgentSession | undefined> {
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    return session;
  }
}
