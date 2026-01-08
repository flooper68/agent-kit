import { eq, desc, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { externalAgents, serverAgents } from '../../../db/schema';
import type { AgentsListResponse, ExternalAgentListItem, ServerAgentListItem } from '../types';

export interface ListAgentsForUserInput {
  userId: string;
}

export type ListAgentsForUserResult = AgentsListResponse;

// Re-export types for backwards compatibility
export type { ExternalAgentListItem, ServerAgentListItem, AgentsListResponse };

/**
 * List all custom agents for a user, separated by type.
 * Excludes deleted agents.
 * Returns external and server agents in a discriminated response.
 * Sorted by: favorites first, then by creation date (newest first).
 */
export class ListAgentsForUserQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: ListAgentsForUserInput): Promise<ListAgentsForUserResult> {
    const { userId } = input;

    // Query external agents
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
      .where(and(eq(externalAgents.userId, userId), isNull(externalAgents.deletedAt)))
      .orderBy(desc(externalAgents.isFavorite), desc(externalAgents.createdAt));

    // Query server agents
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
      .where(and(eq(serverAgents.userId, userId), isNull(serverAgents.deletedAt)))
      .orderBy(desc(serverAgents.isFavorite), desc(serverAgents.createdAt));

    return { external, server };
  }
}
