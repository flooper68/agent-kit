import type { db as DbType } from '../../../db';
import { externalAgents, serverAgents } from '../../../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export interface GetAgentForSelectorInput {
  /** Agent key (used as ID in selector) */
  key: string;
  userId: string;
}

export interface AgentForSelectorDetail {
  id: string;
  name: string;
  description: string | undefined;
  isLocal: true;
}

export type GetAgentForSelectorResult = AgentForSelectorDetail | undefined;

/**
 * Query to get a single active (non-disabled, non-deleted) agent for the selector.
 * Returns undefined if not found or if the agent is disabled/deleted.
 */
export class GetAgentForSelectorQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: GetAgentForSelectorInput
  ): Promise<GetAgentForSelectorResult> {
    const { key, userId } = input;

    // Try to find in external agents first
    const [externalAgent] = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.key, key),
          eq(externalAgents.userId, userId),
          eq(externalAgents.disabled, false),
          isNull(externalAgents.deletedAt)
        )
      )
      .limit(1);

    if (externalAgent) {
      return {
        id: externalAgent.id,
        name: externalAgent.name,
        description: externalAgent.description ?? undefined,
        isLocal: true as const,
      };
    }

    // Try to find in server agents
    const [serverAgent] = await this.db
      .select()
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.key, key),
          eq(serverAgents.userId, userId),
          eq(serverAgents.disabled, false),
          isNull(serverAgents.deletedAt)
        )
      )
      .limit(1);

    if (serverAgent) {
      return {
        id: serverAgent.id,
        name: serverAgent.name,
        description: serverAgent.description ?? undefined,
        isLocal: true as const,
      };
    }

    return undefined;
  }
}
