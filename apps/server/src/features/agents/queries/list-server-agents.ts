import { eq, desc, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { serverAgents } from '../../../db/schema';
import type { ServerAgentListItem } from '../types';

export interface ListServerAgentsInput {
  userId: string;
}

export type ListServerAgentsResult = ServerAgentListItem[];

/**
 * List server agents (Agent Builder created) for a user.
 * Excludes deleted agents.
 */
export class ListServerAgentsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ListServerAgentsInput): Promise<ListServerAgentsResult> {
    const { userId } = input;
    const result = await this.db
      .select({
        id: serverAgents.id,
        key: serverAgents.key,
        name: serverAgents.name,
        description: serverAgents.description,
        provider: serverAgents.provider,
        model: serverAgents.model,
        systemPrompt: serverAgents.systemPrompt,
        tools: serverAgents.tools,
        temperature: serverAgents.temperature,
        maxOutputTokens: serverAgents.maxOutputTokens,
        thinkingConfig: serverAgents.thinkingConfig,
        disabled: serverAgents.disabled,
        isFavorite: serverAgents.isFavorite,
        createdAt: serverAgents.createdAt,
        updatedAt: serverAgents.updatedAt,
      })
      .from(serverAgents)
      .where(and(eq(serverAgents.userId, userId), isNull(serverAgents.deletedAt)))
      .orderBy(desc(serverAgents.isFavorite), desc(serverAgents.createdAt));

    return result;
  }
}
