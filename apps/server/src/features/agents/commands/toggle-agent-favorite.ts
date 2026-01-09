import { eq, and } from 'drizzle-orm';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';
import type { AgentsCommandContextManager } from '../context';

export interface ToggleAgentFavoriteInput {
  id: string;
  userId: string;
  isFavorite: boolean;
  agentType: 'external' | 'server';
}

export type ToggleAgentFavoriteResult = ExternalAgent | ServerAgent | null;

/**
 * Toggle the favorite status of an agent.
 */
export class ToggleAgentFavoriteCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: ToggleAgentFavoriteInput
  ): Promise<ToggleAgentFavoriteResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId, isFavorite, agentType } = input;

      let agent: ExternalAgent | ServerAgent | undefined;

      if (agentType === 'external') {
        const [result] = await tx
          .update(externalAgents)
          .set({
            isFavorite,
            updatedAt: new Date(),
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
            isFavorite,
            updatedAt: new Date(),
          })
          .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
          .returning();
        agent = result;
      }

      if (agent) {
        await cacheInvalidation?.publishAgentUpdated(userId, id);
      }

      return agent ?? null;
    });
  };
}
