import { eq, and, isNull } from 'drizzle-orm';
import { externalAgents } from '../../../db/schema';
import { generateSecretKey, hashSecretKey, generateKeyPrefix } from '../utils';
import type { AgentsCommandContextManager } from '../context';

export interface RegenerateAgentKeyInput {
  id: string;
  userId: string;
}

/** The new plaintext secret key, or null if agent not found */
export type RegenerateAgentKeyResult = string | null;

/**
 * Regenerate the secret key for an external agent.
 * Returns the new plaintext key (only returned once).
 */
export class RegenerateAgentKeyCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: RegenerateAgentKeyInput
  ): Promise<RegenerateAgentKeyResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId } = input;
      const newSecretKey = generateSecretKey();
      const secretKeyHash = hashSecretKey(newSecretKey);
      const secretKeyPrefix = generateKeyPrefix(newSecretKey);

      const [agent] = await tx
        .update(externalAgents)
        .set({
          secretKey: secretKeyHash,
          secretKeyPrefix,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(externalAgents.id, id),
            eq(externalAgents.userId, userId),
            isNull(externalAgents.deletedAt)
          )
        )
        .returning();

      if (!agent) {
        return null;
      }

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentUpdated(userId, id);

      // Return plaintext key - this is the only time it's available
      return newSecretKey;
    });
  };
}
