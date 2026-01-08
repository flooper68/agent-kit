import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';

export interface GetAgentByKeyInput {
  key: string;
  userId: string;
}

export type AgentByKeyResult =
  | { type: 'external'; agent: ExternalAgent }
  | { type: 'server'; agent: ServerAgent }
  | null;

/**
 * Get a single agent by key (verifies ownership).
 * Used for agent spawning where the key is used as the identifier.
 * Checks both external and server agents tables.
 * Excludes deleted agents.
 */
export class GetAgentByKeyQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAgentByKeyInput): Promise<AgentByKeyResult> {
    const { key, userId } = input;

    // Check external agents first
    const [externalAgent] = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.key, key),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      );

    if (externalAgent) {
      return { type: 'external', agent: externalAgent };
    }

    // Check server agents
    const [serverAgent] = await this.db
      .select()
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.key, key),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      );

    if (serverAgent) {
      return { type: 'server', agent: serverAgent };
    }

    return null;
  }
}
