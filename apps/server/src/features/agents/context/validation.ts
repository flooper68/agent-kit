import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { serverAgents, externalAgents, skills } from '../../../db/schema';
import type { Transaction } from './types';

/**
 * Allowed subagents configuration - IDs of agents that can be spawned
 */
export interface AllowedSubagentsInput {
  serverAgentIds?: string[];
  externalAgentIds?: string[];
}

/**
 * Validates that all referenced agents in allowedSubagents belong to the user
 * and are not deleted. Throws an error if any agent IDs are invalid or inaccessible.
 *
 * @param tx - The database transaction
 * @param userId - The user ID to validate ownership against
 * @param allowedSubagents - The allowed subagents configuration to validate
 * @throws Error if any agent IDs are invalid or not owned by the user
 */
export async function validateAllowedSubagentsOwnership(
  tx: Transaction,
  userId: string,
  allowedSubagents: AllowedSubagentsInput | undefined
): Promise<void> {
  if (!allowedSubagents) {
    return;
  }

  // Validate server agent IDs
  if (allowedSubagents.serverAgentIds?.length) {
    const validAgents = await tx
      .select({ id: serverAgents.id })
      .from(serverAgents)
      .where(
        and(
          inArray(serverAgents.id, allowedSubagents.serverAgentIds),
          eq(serverAgents.userId, userId),
          isNull(serverAgents.deletedAt)
        )
      );
    const validIds = new Set(validAgents.map((a) => a.id));
    const invalidIds = allowedSubagents.serverAgentIds.filter(
      (id) => !validIds.has(id)
    );
    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid or inaccessible server agents: ${invalidIds.join(', ')}`
      );
    }
  }

  // Validate external agent IDs
  if (allowedSubagents.externalAgentIds?.length) {
    const validAgents = await tx
      .select({ id: externalAgents.id })
      .from(externalAgents)
      .where(
        and(
          inArray(externalAgents.id, allowedSubagents.externalAgentIds),
          eq(externalAgents.userId, userId),
          isNull(externalAgents.deletedAt)
        )
      );
    const validIds = new Set(validAgents.map((a) => a.id));
    const invalidIds = allowedSubagents.externalAgentIds.filter(
      (id) => !validIds.has(id)
    );
    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid or inaccessible external agents: ${invalidIds.join(', ')}`
      );
    }
  }
}

/**
 * Validates that all referenced skill IDs exist and are accessible to the user.
 * Skills are accessible if they are system skills OR owned by the user.
 * Throws an error if any skill IDs are invalid or inaccessible.
 *
 * @param tx - The database transaction
 * @param skillIds - The skill IDs to validate
 * @param userId - The user ID to validate ownership against
 * @param orgId - The organization ID to validate ownership against
 * @throws Error if any skill IDs are invalid or not accessible to the user
 */
export async function validateAllowedSkillsAccess(
  tx: Transaction,
  skillIds: string[],
  userId: string,
  orgId: string
): Promise<void> {
  if (skillIds.length === 0) {
    return;
  }

  // Fetch all valid skills (system skills OR user's skills)
  const validSkills = await tx
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(
        inArray(skills.id, skillIds),
        or(
          eq(skills.isSystem, true),
          and(eq(skills.userId, userId), eq(skills.orgId, orgId))
        )
      )
    );

  const validIds = new Set(validSkills.map((s) => s.id));
  const invalidIds = skillIds.filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error(
      `Invalid or inaccessible skill IDs: ${invalidIds.join(', ')}`
    );
  }
}
