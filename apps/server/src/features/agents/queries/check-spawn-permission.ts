import { eq, and, isNull } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  externalAgents,
  serverAgentAllowedSubagents,
  externalAgentAllowedSubagents,
} from '../../../db/schema';

export interface CheckSpawnPermissionInput {
  parentAgentKey: string;
  targetAgentKey: string;
  userId: string;
}

export interface CheckSpawnPermissionResult {
  allowed: boolean;
  error?: string;
}

/**
 * Check if a parent agent is allowed to spawn a target agent.
 * Simply compares the target against the parent's allowed subagents list.
 */
export class CheckSpawnPermissionQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: CheckSpawnPermissionInput
  ): Promise<CheckSpawnPermissionResult> {
    const { parentAgentKey, targetAgentKey, userId } = input;

    // Find parent agent and its allowed subagent IDs
    const parentInfo = await this.findParentWithAllowedIds(
      parentAgentKey,
      userId
    );

    if (!parentInfo) {
      return {
        allowed: false,
        error: `Parent agent "${parentAgentKey}" not found or does not have spawning capabilities.`,
      };
    }

    // Find target agent ID
    const targetId = await this.findAgentId(targetAgentKey, userId);

    if (!targetId) {
      return {
        allowed: false,
        error: `Target agent "${targetAgentKey}" not found.`,
      };
    }

    // Check if target is in allowed list
    const isAllowed = parentInfo.allowedIds.has(targetId);

    if (!isAllowed) {
      if (parentInfo.allowedIds.size === 0) {
        return {
          allowed: false,
          error: `Agent "${parentAgentKey}" is not allowed to spawn any sub-agents. Configure allowed sub-agents in agent settings.`,
        };
      }
      return {
        allowed: false,
        error: `Agent "${parentAgentKey}" is not allowed to spawn "${targetAgentKey}".`,
      };
    }

    return { allowed: true };
  }

  /**
   * Find parent agent and return its allowed subagent IDs
   */
  private async findParentWithAllowedIds(
    key: string,
    userId: string
  ): Promise<{ id: string; allowedIds: Set<string> } | null> {
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
      const allowedIds = await this.getServerAgentAllowedIds(serverAgent.id);
      return { id: serverAgent.id, allowedIds };
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
      const allowedIds = await this.getExternalAgentAllowedIds(
        externalAgent.id
      );
      return { id: externalAgent.id, allowedIds };
    }

    return null;
  }

  /**
   * Find agent ID by key (checks both server and external agents)
   */
  private async findAgentId(
    key: string,
    userId: string
  ): Promise<string | null> {
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

    if (serverAgent) return serverAgent.id;

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

    if (externalAgent) return externalAgent.id;

    return null;
  }

  /**
   * Get set of allowed agent IDs for a server agent
   */
  private async getServerAgentAllowedIds(
    serverAgentId: string
  ): Promise<Set<string>> {
    const entries = await this.db
      .select({
        allowedServerAgentId: serverAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId:
          serverAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(serverAgentAllowedSubagents)
      .where(eq(serverAgentAllowedSubagents.serverAgentId, serverAgentId));

    const ids = new Set<string>();
    for (const entry of entries) {
      if (entry.allowedServerAgentId) ids.add(entry.allowedServerAgentId);
      if (entry.allowedExternalAgentId) ids.add(entry.allowedExternalAgentId);
    }
    return ids;
  }

  /**
   * Get set of allowed agent IDs for an external agent
   */
  private async getExternalAgentAllowedIds(
    externalAgentId: string
  ): Promise<Set<string>> {
    const entries = await this.db
      .select({
        allowedServerAgentId:
          externalAgentAllowedSubagents.allowedServerAgentId,
        allowedExternalAgentId:
          externalAgentAllowedSubagents.allowedExternalAgentId,
      })
      .from(externalAgentAllowedSubagents)
      .where(
        eq(externalAgentAllowedSubagents.externalAgentId, externalAgentId)
      );

    const ids = new Set<string>();
    for (const entry of entries) {
      if (entry.allowedServerAgentId) ids.add(entry.allowedServerAgentId);
      if (entry.allowedExternalAgentId) ids.add(entry.allowedExternalAgentId);
    }
    return ids;
  }
}
