import type { db as DbType } from '../../../db';
import { externalAgents, serverAgents } from '../../../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export interface ListAgentsForSelectorInput {
  userId: string;
}

export interface AgentForSelector {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
  isLocal: true;
  isExternal: boolean;
  isFavorite: boolean;
}

export type ListAgentsForSelectorResult = AgentForSelector[];

/**
 * Query to list all active (non-disabled, non-deleted) agents for the agent selector dropdown.
 * Combines external and server agents, filters out disabled ones, and sorts by favorite status then name.
 */
export class ListAgentsForSelectorQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: ListAgentsForSelectorInput
  ): Promise<ListAgentsForSelectorResult> {
    const { userId } = input;

    // Fetch external agents (non-deleted, non-disabled)
    const externalAgentsResult = await this.db
      .select()
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.userId, userId),
          eq(externalAgents.disabled, false),
          isNull(externalAgents.deletedAt)
        )
      );

    // Fetch server agents (non-deleted, non-disabled)
    const serverAgentsResult = await this.db
      .select()
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.userId, userId),
          eq(serverAgents.disabled, false),
          isNull(serverAgents.deletedAt)
        )
      );

    // Map external agents
    const mappedExternal: AgentForSelector[] = externalAgentsResult.map(
      (agent) => ({
        id: agent.key,
        name: agent.name,
        description: agent.description,
        provider: null,
        model: null,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        isLocal: true as const,
        isExternal: true,
        isFavorite: agent.isFavorite,
      })
    );

    // Map server agents
    const mappedServer: AgentForSelector[] = serverAgentsResult.map(
      (agent) => ({
        id: agent.key,
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        model: agent.model,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        isLocal: true as const,
        isExternal: false,
        isFavorite: agent.isFavorite,
      })
    );

    // Combine and sort: favorites first, then by name
    const allAgents = [...mappedExternal, ...mappedServer];
    return allAgents.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}
