import { eq, asc, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface GetSessionChildrenInput {
  sessionId: string;
  userId: string;
}

export type GetSessionChildrenResult = AgentSession[];

/**
 * Query to get all child sessions spawned from a parent session
 */
export class GetSessionChildrenQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetSessionChildrenInput
  ): Promise<GetSessionChildrenResult> {
    const { sessionId, userId } = input;
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
