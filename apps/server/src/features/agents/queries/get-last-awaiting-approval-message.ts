import { eq, and, desc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessionMessages } from '../../../db/schema';

export class GetLastAwaitingApprovalMessageQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(sessionId: string): Promise<{ id: string } | undefined> {
    const result = await this.db
      .select({ id: agentSessionMessages.id })
      .from(agentSessionMessages)
      .where(
        and(
          eq(agentSessionMessages.sessionId, sessionId),
          eq(agentSessionMessages.status, 'awaiting_approval')
        )
      )
      .orderBy(desc(agentSessionMessages.createdAt))
      .limit(1);
    return result[0];
  }
}
