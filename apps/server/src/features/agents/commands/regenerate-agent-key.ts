import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents } from '../../../db/schema';
import { generateSecretKey, hashSecretKey, generateKeyPrefix } from '../utils';

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
  constructor(private db: typeof DbType) {}

  async execute(
    input: RegenerateAgentKeyInput
  ): Promise<RegenerateAgentKeyResult> {
    const { id, userId } = input;
    const newSecretKey = generateSecretKey();
    const secretKeyHash = hashSecretKey(newSecretKey);
    const secretKeyPrefix = generateKeyPrefix(newSecretKey);

    const [agent] = await this.db
      .update(externalAgents)
      .set({
        secretKey: secretKeyHash,
        secretKeyPrefix,
        updatedAt: new Date(),
      })
      .where(and(eq(externalAgents.id, id), eq(externalAgents.userId, userId)))
      .returning();

    if (!agent) {
      return null;
    }

    // Return plaintext key - this is the only time it's available
    return newSecretKey;
  }
}
