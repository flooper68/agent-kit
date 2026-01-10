import { eq, and } from 'drizzle-orm';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';
import type { AgentsCommandContextManager } from '../context';

export interface SetAgentDisabledInput {
  id: string;
  userId: string;
  disabled: boolean;
  agentType: 'external' | 'server';
}

export type SetAgentDisabledResult = ExternalAgent | ServerAgent | null;

/**
 * Enable or disable an agent (soft delete).
 */
export class SetAgentDisabledCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: SetAgentDisabledInput
  ): Promise<SetAgentDisabledResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId, disabled, agentType } = input;

      let agent: ExternalAgent | ServerAgent | undefined;

      if (agentType === 'external') {
        const [result] = await tx
          .update(externalAgents)
          .set({
            disabled,
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
            disabled,
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
