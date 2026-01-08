import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents, type ExternalAgent } from '../../../db/schema';

export interface FindAgentByKeyPrefixInput {
  prefix: string;
}

export type FindAgentByKeyPrefixResult = ExternalAgent | null;

/**
 * Find an external agent by its key prefix for initial identification during HMAC auth.
 * The prefix is used to identify the agent before HMAC verification proves identity.
 * Only returns enabled, non-deleted agents.
 */
export class FindAgentByKeyPrefixQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: FindAgentByKeyPrefixInput
  ): Promise<FindAgentByKeyPrefixResult> {
    const { prefix } = input;
    const [agent] = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.secretKeyPrefix, prefix),
          eq(externalAgents.disabled, false),
          isNull(externalAgents.deletedAt)
        )
      );

    return agent ?? null;
  }
}
