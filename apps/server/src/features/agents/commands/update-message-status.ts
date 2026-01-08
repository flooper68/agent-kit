import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessionMessages,
  type AgentSessionMessageStatus,
  type AgentSessionMessageMetadata,
} from '../../../db/schema';

export interface UpdateMessageStatusInput {
  messageId: string;
  status: AgentSessionMessageStatus;
  metadata?: AgentSessionMessageMetadata;
}

export type UpdateMessageStatusResult = void;

export class UpdateMessageStatusCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateMessageStatusInput): Promise<UpdateMessageStatusResult> {
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
