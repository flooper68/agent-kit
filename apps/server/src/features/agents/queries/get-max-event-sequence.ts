import { eq, max } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionEvents } from '../../../db/schema';

export class GetMaxEventSequenceQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(messageId: string): Promise<number> {
    const result = await this.db
      .select({ maxSeq: max(agentSessionEvents.sequence) })
      .from(agentSessionEvents)
      .where(eq(agentSessionEvents.messageId, messageId));
    return result[0]?.maxSeq ?? -1;
  }
}
