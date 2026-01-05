import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';

export interface SessionAgentInfo {
  agentId: string;
  isLocalAgent: boolean;
}

export class GetAgentIdForSessionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<string | undefined> {
    const [session] = await this.db
      .select({ agentId: agentSessions.agentId })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    return session?.agentId;
  }

  async executeWithLocalFlag(
    sessionId: string
  ): Promise<SessionAgentInfo | undefined> {
    const [session] = await this.db
      .select({
        agentId: agentSessions.agentId,
        isLocalAgent: agentSessions.isLocalAgent,
      })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    return session;
  }
}
