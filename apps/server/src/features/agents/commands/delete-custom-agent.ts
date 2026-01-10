import { eq, and } from 'drizzle-orm';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';
import type { AgentsCommandContextManager } from '../context';

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
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: DeleteCustomAgentInput
  ): Promise<DeleteCustomAgentResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId, agentType } = input;
      const deletedAt = new Date();

      let agent: ExternalAgent | ServerAgent | undefined;

      if (agentType === 'external') {
        const [result] = await tx
          .update(externalAgents)
          .set({
            deletedAt,
            updatedAt: deletedAt,
          })
          .where(
            and(eq(externalAgents.id, id), eq(externalAgents.userId, userId))
          )
          .returning();
        agent = result;
      } else {
        const [result] = await tx
          .update(serverAgents)
          .set({
            deletedAt,
            updatedAt: deletedAt,
          })
          .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
          .returning();
        agent = result;
      }

      if (agent) {
        await cacheInvalidation?.publishAgentDeleted(userId, id);
      }

      return agent ?? null;
    });
  };
}
