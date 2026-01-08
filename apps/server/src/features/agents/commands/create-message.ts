import type { db as DbType } from '../../../db';
import {
  agentSessionMessages,
  type AgentSessionMessage,
  type AgentSessionMessageStatus,
} from '../../../db/schema';

export interface CreateMessageInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  status: AgentSessionMessageStatus;
}

export type CreateMessageResult = AgentSessionMessage;

export class CreateMessageCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateMessageInput): Promise<CreateMessageResult> {
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
