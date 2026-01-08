import { eq, and, desc, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents, serverAgents } from '../../../db/schema';
import type { AgentsListResponse } from '../types';

export interface ListActiveAgentsInput {
  userId: string;
}

export type ListActiveAgentsResult = AgentsListResponse;

/**
 * List all active (non-disabled, non-deleted) custom agents for a user.
 * Used for agent spawning and selection.
 */
export class ListActiveAgentsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ListActiveAgentsInput): Promise<ListActiveAgentsResult> {
    const { userId } = input;

    // Query active external agents
    const external = await this.db
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
      .where(
        and(
          eq(externalAgents.userId, userId),
          eq(externalAgents.disabled, false),
          isNull(externalAgents.deletedAt)
        )
      )
      .orderBy(desc(externalAgents.isFavorite), desc(externalAgents.createdAt));

    // Query active server agents
    const server = await this.db
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
      .where(
        and(
          eq(serverAgents.userId, userId),
          eq(serverAgents.disabled, false),
          isNull(serverAgents.deletedAt)
        )
      )
      .orderBy(desc(serverAgents.isFavorite), desc(serverAgents.createdAt));

    return { external, server };
  }
}
