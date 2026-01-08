import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents, type ExternalAgent } from '../../../db/schema';
import { hashSecretKey } from '../utils';

export interface ValidateAgentKeyInput {
  secretKey: string;
}

export type ValidateAgentKeyResult = ExternalAgent | null;

/**
 * Validate a secret key and return the associated external agent.
 * Used for WebSocket authentication.
 * Only returns enabled, non-deleted agents.
 */
export class ValidateAgentKeyQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ValidateAgentKeyInput): Promise<ValidateAgentKeyResult> {
    const { secretKey } = input;
    const secretKeyHash = hashSecretKey(secretKey);

    const [agent] = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.secretKey, secretKeyHash),
          eq(externalAgents.disabled, false),
          isNull(externalAgents.deletedAt)
        )
      );

    return agent ?? null;
  }
}
