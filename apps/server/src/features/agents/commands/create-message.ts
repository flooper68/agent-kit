import type { db as DbType } from '../../../db';
import { agentSessionMessages } from '../../../db/schema';
import type { AgentSessionMessage, CreateMessageInput } from '../types';

export class CreateMessageCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateMessageInput): Promise<AgentSessionMessage> {
    const [message] = await this.db
      .insert(agentSessionMessages)
      .values({
        sessionId: input.sessionId,
        role: input.role,
        status: input.status,
      })
      .returning();

    if (!message) {
      throw new Error('Failed to create message');
    }
    return message;
  }
}
