import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  externalAgents,
  serverAgentAllowedSubagents,
  externalAgentAllowedSubagents,
} from '../../../db/schema';

export interface AllowedSubagentInfo {
  key: string;
  name: string;
  description: string | null;
  type: 'server' | 'external';
}

export interface GetAllowedSubagentsInput {
  agentKey: string;
  userId: string;
}

/**
 * Get the list of allowed subagents for a given agent.
 * Returns full details (key, name, description, type) for each allowed subagent.
 */
export class GetAllowedSubagentsQuery {
  constructor(private db: typeof DbType) {}

  async execute(input: GetAllowedSubagentsInput): Promise<AllowedSubagentInfo[]> {
    const { agentKey, userId } = input;

    // Find parent agent and get allowed IDs
    const allowedIds = await this.findParentAndGetAllowedIds(agentKey, userId);

    if (!allowedIds) {
      // Agent not found
      return [];
    }

    if (allowedIds.serverIds.length === 0 && allowedIds.externalIds.length === 0) {
      // No allowed subagents configured
      return [];
    }

    // Fetch details for allowed agents
    const results: AllowedSubagentInfo[] = [];

    // Fetch server agents
    if (allowedIds.serverIds.length > 0) {
      const serverResults = await this.db
        .select({
          key: serverAgents.key,
          name: serverAgents.name,
          description: serverAgents.description,
        })
        .from(serverAgents)
        .where(
          and(
            inArray(serverAgents.id, allowedIds.serverIds),
            isNull(serverAgents.deletedAt),
            eq(serverAgents.disabled, false)
          )
        );

      for (const agent of serverResults) {
        results.push({
          key: agent.key,
          name: agent.name,
          description: agent.description,
          type: 'server',
        });
      }
    }

    // Fetch external agents
    if (allowedIds.externalIds.length > 0) {
      const externalResults = await this.db
        .select({
          key: externalAgents.key,
          name: externalAgents.name,
          description: externalAgents.description,
        })
        .from(externalAgents)
        .where(
          and(
            inArray(externalAgents.id, allowedIds.externalIds),
            isNull(externalAgents.deletedAt),
            eq(externalAgents.disabled, false)
          )
        );

      for (const agent of externalResults) {
        results.push({
          key: agent.key,
          name: agent.name,
          description: agent.description,
          type: 'external',
        });
      }
    }

    return results;
  }

  /**
   * Find parent agent and return its allowed subagent IDs separated by type
   */
  private async findParentAndGetAllowedIds(
    key: string,
    userId: string
  ): Promise<{ serverIds: string[]; externalIds: string[] } | null> {
    // Check server agents first
    const [serverAgent] = await this.db
      .select({ id: serverAgents.id })
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.key, key),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      )
      .limit(1);

    if (serverAgent) {
      return this.getServerAgentAllowedIds(serverAgent.id);
    }

    // Check external agents
    const [externalAgent] = await this.db
      .select({ id: externalAgents.id })
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.key, key),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      )
      .limit(1);

    if (externalAgent) {
      return this.getExternalAgentAllowedIds(externalAgent.id);
    }

    return null;
  }

  /**
   * Get allowed agent IDs for a server agent, separated by type
   */
  private async getServerAgentAllowedIds(
    serverAgentId: string
  ): Promise<{ serverIds: string[]; externalIds: string[] }> {
    const entries = await this.db
      .select({
        allowedServerAgentId: serverAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId: serverAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(serverAgentAllowedSubagents)
      .where(eq(serverAgentAllowedSubagents.serverAgentId, serverAgentId));

    const serverIds: string[] = [];
    const externalIds: string[] = [];

    for (const entry of entries) {
      if (entry.allowedServerAgentId) serverIds.push(entry.allowedServerAgentId);
      if (entry.allowedExternalAgentId) externalIds.push(entry.allowedExternalAgentId);
    }

    return { serverIds, externalIds };
  }

  /**
   * Get allowed agent IDs for an external agent, separated by type
   */
  private async getExternalAgentAllowedIds(
    externalAgentId: string
  ): Promise<{ serverIds: string[]; externalIds: string[] }> {
    const entries = await this.db
      .select({
        allowedServerAgentId: externalAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId: externalAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(externalAgentAllowedSubagents)
      .where(eq(externalAgentAllowedSubagents.externalAgentId, externalAgentId));

    const serverIds: string[] = [];
    const externalIds: string[] = [];

    for (const entry of entries) {
      if (entry.allowedServerAgentId) serverIds.push(entry.allowedServerAgentId);
      if (entry.allowedExternalAgentId) externalIds.push(entry.allowedExternalAgentId);
    }

    return { serverIds, externalIds };
  }
}
