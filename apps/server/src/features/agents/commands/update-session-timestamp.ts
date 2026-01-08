import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions } from '../../../db/schema';

export interface UpdateSessionTimestampInput {
  sessionId: string;
}

export type UpdateSessionTimestampResult = void;

export class UpdateSessionTimestampCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: UpdateSessionTimestampInput
  ): Promise<UpdateSessionTimestampResult> {
    const { sessionId } = input;
    await this.db
      .update(agentSessions)
      .set({ updatedAt: new Date() })
      .where(eq(agentSessions.id, sessionId));
  }
}
