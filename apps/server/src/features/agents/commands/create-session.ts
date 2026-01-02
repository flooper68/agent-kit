import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { AgentSession, CreateSessionInput } from '../types';

export class CreateSessionCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateSessionInput): Promise<AgentSession> {
    const [session] = await this.db
      .insert(agentSessions)
      .values({
        userId: input.userId,
        agentId: input.agentId,
        title: input.title,
      })
      .returning();

    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  }
}
