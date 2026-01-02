import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';
import type { AgentSession, UpdateSessionTitleInput } from '../types';

export class UpdateSessionTitleCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateSessionTitleInput
  ): Promise<AgentSession | undefined> {
    const [updated] = await this.db
      .update(agentSessions)
      .set({
        title: input.title,
        updatedAt: new Date(),
      })
      .where(eq(agentSessions.id, input.sessionId))
      .returning();

    return updated;
  }
}
