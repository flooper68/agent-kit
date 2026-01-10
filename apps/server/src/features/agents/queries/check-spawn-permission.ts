import { eq, and, isNull, sql } from 'drizzle-orm';
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

// Generic error message to prevent information leakage
const PERMISSION_DENIED_ERROR = 'Spawn permission denied';

/**
 * Check if a parent agent is allowed to spawn a target agent.
 * Validates that both agents exist, are not deleted, are not disabled,
 * and that the target is in the parent's allowed subagents list.
 *
 * Uses optimized queries to minimize database round-trips.
 */
export class CheckSpawnPermissionQuery {
  constructor(private db: typeof DbType) {}

  async execute(
    input: CheckSpawnPermissionInput
  ): Promise<CheckSpawnPermissionResult> {
    const { parentAgentKey, targetAgentKey, userId } = input;

    // Step 1: Find parent agent (server or external) with single query
    const parent = await this.findActiveAgent(parentAgentKey, userId);
    if (!parent) {
      return { allowed: false, error: PERMISSION_DENIED_ERROR };
    }

    // Step 2: Find target agent (server or external) with single query
    const target = await this.findActiveAgent(targetAgentKey, userId);
    if (!target) {
      return { allowed: false, error: PERMISSION_DENIED_ERROR };
    }

    // Step 3: Check if target is in parent's allowed subagents list
    const isAllowed = await this.checkAllowedSubagent(
      parent.id,
      parent.type,
      target.id,
      target.type
    );

    if (!isAllowed) {
      return { allowed: false, error: PERMISSION_DENIED_ERROR };
    }

    return { allowed: true };
  }

  /**
   * Find an active (not deleted, not disabled) agent by key.
   * Checks both server and external agents in a single query using UNION.
   */
  private async findActiveAgent(
    key: string,
    userId: string
  ): Promise<{ id: string; type: 'server' | 'external' } | null> {
    // Query server agents
    const serverQuery = this.db
      .select({
        id: serverAgents.id,
        type: sql<'server'>`'server'`.as('type'),
      })
      .from(serverAgents)
      .where(
        and(
          eq(serverAgents.key, key),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt),
          eq(serverAgents.disabled, false)
        )
      )
      .limit(1);

    // Query external agents
    const externalQuery = this.db
      .select({
        id: externalAgents.id,
        type: sql<'external'>`'external'`.as('type'),
      })
      .from(externalAgents)
      .where(
        and(
          eq(externalAgents.key, key),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt),
          eq(externalAgents.disabled, false)
        )
      )
      .limit(1);

    // Execute both queries and return first result
    // Using UNION would require raw SQL, so we run both in parallel instead
    const [serverResults, externalResults] = await Promise.all([
      serverQuery,
      externalQuery,
    ]);

    const serverAgent = serverResults[0];
    if (serverAgent) {
      return { id: serverAgent.id, type: 'server' };
    }

    const externalAgent = externalResults[0];
    if (externalAgent) {
      return { id: externalAgent.id, type: 'external' };
    }

    return null;
  }

  /**
   * Check if the target agent is in the parent's allowed subagents list.
   * Uses the appropriate junction table based on parent type.
   */
  private async checkAllowedSubagent(
    parentId: string,
    parentType: 'server' | 'external',
    targetId: string,
    targetType: 'server' | 'external'
  ): Promise<boolean> {
    if (parentType === 'server') {
      // Check server agent's allowed subagents
      const [result] = await this.db
        .select({ id: serverAgentAllowedSubagents.id })
        .from(serverAgentAllowedSubagents)
        .where(
          and(
            eq(serverAgentAllowedSubagents.serverAgentId, parentId),
            targetType === 'server'
              ? eq(serverAgentAllowedSubagents.allowedServerAgentId, targetId)
              : eq(serverAgentAllowedSubagents.allowedExternalAgentId, targetId)
          )
        )
        .limit(1);

      return !!result;
    } else {
      // Check external agent's allowed subagents
      const [result] = await this.db
        .select({ id: externalAgentAllowedSubagents.id })
        .from(externalAgentAllowedSubagents)
        .where(
          and(
            eq(externalAgentAllowedSubagents.externalAgentId, parentId),
            targetType === 'server'
              ? eq(externalAgentAllowedSubagents.allowedServerAgentId, targetId)
              : eq(
                  externalAgentAllowedSubagents.allowedExternalAgentId,
                  targetId
                )
          )
        )
        .limit(1);

      return !!result;
    }
  }
}
