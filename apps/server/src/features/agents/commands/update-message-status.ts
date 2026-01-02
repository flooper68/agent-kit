import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionMessages } from '../../../db/schema';
import type { UpdateMessageStatusInput } from '../types';

export class UpdateMessageStatusCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateMessageStatusInput): Promise<void> {
    await this.db
      .update(agentSessionMessages)
      .set({
        status: input.status,
        metadata: input.metadata ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(agentSessionMessages.id, input.messageId));
  }
}
