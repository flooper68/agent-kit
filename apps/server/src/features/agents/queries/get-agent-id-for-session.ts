import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';

export interface GetAgentIdForSessionInput {
  sessionId: string;
}

export type GetAgentIdForSessionResult = string | undefined;

export class GetAgentIdForSessionQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: GetAgentIdForSessionInput
  ): Promise<GetAgentIdForSessionResult> {
    const { sessionId } = input;
    const [session] = await this.db
      .select({ agentId: agentSessions.agentId })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    return session?.agentId;
  }
}
