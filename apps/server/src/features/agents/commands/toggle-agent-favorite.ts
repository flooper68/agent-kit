import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  externalAgents,
  serverAgents,
  type ExternalAgent,
  type ServerAgent,
} from '../../../db/schema';

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
  constructor(private db: typeof DbType) {}

  async execute(
    input: ToggleAgentFavoriteInput
  ): Promise<ToggleAgentFavoriteResult> {
    const { id, userId, isFavorite, agentType } = input;

    if (agentType === 'external') {
      const [agent] = await this.db
        .update(externalAgents)
        .set({
          isFavorite,
          updatedAt: new Date(),
        })
        .where(
          and(eq(externalAgents.id, id), eq(externalAgents.userId, userId))
        )
        .returning();
      return agent ?? null;
    }

    const [agent] = await this.db
      .update(serverAgents)
      .set({
        isFavorite,
        updatedAt: new Date(),
      })
      .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }
}
