import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';

export interface DeleteCustomAgentInput {
  id: string;
  userId: string;
  agentType: 'external' | 'server';
}

export type DeleteCustomAgentResult = ExternalAgent | ServerAgent | null;

/**
 * Soft delete an agent by setting deletedAt timestamp.
 * The agent is hidden from all lists but data is preserved for auditing.
 */
export class DeleteCustomAgentCommand {
  constructor(private db: typeof DbType) {}

  async execute(input: DeleteCustomAgentInput): Promise<DeleteCustomAgentResult> {
    const { id, userId, agentType } = input;
    const deletedAt = new Date();

    if (agentType === 'external') {
      const [agent] = await this.db
        .update(externalAgents)
        .set({
          deletedAt,
          updatedAt: deletedAt,
        })
        .where(and(eq(externalAgents.id, id), eq(externalAgents.userId, userId)))
        .returning();
      return agent ?? null;
    }

    const [agent] = await this.db
      .update(serverAgents)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }
}
