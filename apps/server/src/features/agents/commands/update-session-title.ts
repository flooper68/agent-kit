import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface UpdateSessionTitleInput {
  sessionId: string;
  title: string;
}

export type UpdateSessionTitleResult = AgentSession | undefined;

export class UpdateSessionTitleCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateSessionTitleInput
  ): Promise<UpdateSessionTitleResult> {
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
