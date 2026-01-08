import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface GetSessionByIdForUserInput {
  sessionId: string;
  userId: string;
}

export type GetSessionByIdForUserResult = AgentSession | undefined;

export class GetSessionByIdForUserQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetSessionByIdForUserInput
  ): Promise<GetSessionByIdForUserResult> {
    const { sessionId, userId } = input;
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(
        and(eq(agentSessions.id, sessionId), eq(agentSessions.userId, userId))
      );

    return session;
  }
}
