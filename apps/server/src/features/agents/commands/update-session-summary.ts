import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSession } from '../../../db/schema';

export interface UpdateSessionSummaryInput {
  sessionId: string;
  title: string;
  description: string;
}

export type UpdateSessionSummaryResult = AgentSession | undefined;

export class UpdateSessionSummaryCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateSessionSummaryInput
  ): Promise<UpdateSessionSummaryResult> {
    const [updated] = await this.db
      .update(agentSessions)
      .set({
        title: input.title,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(eq(agentSessions.id, input.sessionId))
      .returning();

    return updated;
  }
}
