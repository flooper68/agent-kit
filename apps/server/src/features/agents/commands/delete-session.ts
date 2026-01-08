import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface DeleteSessionInput {
  sessionId: string;
}

export type DeleteSessionResult = AgentSession | undefined;

export class DeleteSessionCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: DeleteSessionInput): Promise<DeleteSessionResult> {
    const { sessionId } = input;
    const [deleted] = await this.db
      .delete(agentSessions)
      .where(eq(agentSessions.id, sessionId))
      .returning();

    return deleted;
  }
}
