import { eq, desc, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents } from '../../../db/schema';
import type { ExternalAgentListItem } from '../types';

export interface ListExternalAgentsInput {
  userId: string;
}

export type ListExternalAgentsResult = ExternalAgentListItem[];

/**
 * List external agents (WebSocket connected) for a user.
 * Excludes deleted agents.
 */
export class ListExternalAgentsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ListExternalAgentsInput): Promise<ListExternalAgentsResult> {
    const { userId } = input;
    const result = await this.db
      .select({
        id: externalAgents.id,
        key: externalAgents.key,
        name: externalAgents.name,
        description: externalAgents.description,
        secretKeyPrefix: externalAgents.secretKeyPrefix,
        disabled: externalAgents.disabled,
        isFavorite: externalAgents.isFavorite,
        createdAt: externalAgents.createdAt,
        updatedAt: externalAgents.updatedAt,
      })
      .from(externalAgents)
      .where(and(eq(externalAgents.userId, userId), isNull(externalAgents.deletedAt)))
      .orderBy(desc(externalAgents.isFavorite), desc(externalAgents.createdAt));

    return result;
  }
}
