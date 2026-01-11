import { eq, and } from 'drizzle-orm';
import {
  externalAgents,
  externalAgentAllowedSubagents,
  externalAgentAllowedSkills,
  type ExternalAgent,
} from '../../../db/schema';
import {
  type AgentsCommandContextManager,
  type AllowedSubagentsInput,
  validateAllowedSubagentsOwnership,
  validateAllowedSkillsAccess,
} from '../context';

export interface UpdateExternalAgentInput {
  id: string;
  userId: string;
  orgId: string;
  updates: {
    name?: string;
    description?: string;
    isFavorite?: boolean;
    // Sub-agent permissions
    allowedSubagents?: AllowedSubagentsInput;
    // Skill permissions
    allowedSkillIds?: string[];
    // Allowed tools - which server tools this agent can use
    allowedTools?: string[];
  };
}

export type UpdateExternalAgentResult = ExternalAgent | null;

/**
 * Update an external agent's configuration.
 * Note: key cannot be changed after creation.
 */
export class UpdateExternalAgentCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: UpdateExternalAgentInput
  ): Promise<UpdateExternalAgentResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId, updates } = input;

      // Extract allowedSubagents and allowedSkillIds - we handle them separately via junction tables
      const { allowedSubagents, allowedSkillIds, ...dbUpdates } = updates;

      // Validate ownership of referenced agents before updating
      await validateAllowedSubagentsOwnership(tx, userId, allowedSubagents);

      // Validate skill IDs exist and are accessible (only if skills are being updated)
      if (allowedSkillIds !== undefined) {
        await validateAllowedSkillsAccess(
          tx,
          allowedSkillIds,
          userId,
          input.orgId
        );
      }

      // Only update if there are DB fields to update
      let agent: ExternalAgent | undefined;

      if (Object.keys(dbUpdates).length > 0) {
        const [updatedAgent] = await tx
          .update(externalAgents)
          .set({
            ...dbUpdates,
            updatedAt: new Date(),
          })
          .where(
            and(eq(externalAgents.id, id), eq(externalAgents.userId, userId))
          )
          .returning();

        agent = updatedAgent;
      } else {
        // Just fetch the agent if no DB updates
        const [existingAgent] = await tx
          .select()
          .from(externalAgents)
          .where(
            and(eq(externalAgents.id, id), eq(externalAgents.userId, userId))
          )
          .limit(1);

        agent = existingAgent;
      }

      if (!agent) {
        return null;
      }

      // Update allowed subagents if provided
      if (allowedSubagents !== undefined) {
        // Delete existing junction records
        await tx
          .delete(externalAgentAllowedSubagents)
          .where(eq(externalAgentAllowedSubagents.externalAgentId, id));

        // Insert new junction records
        const junctionRows: Array<{
          externalAgentId: string;
          allowedServerAgentId?: string;
          allowedExternalAgentId?: string;
        }> = [];

        for (const serverAgentId of allowedSubagents.serverAgentIds ?? []) {
          junctionRows.push({
            externalAgentId: id,
            allowedServerAgentId: serverAgentId,
          });
        }

        for (const externalAgentId of allowedSubagents.externalAgentIds ?? []) {
          junctionRows.push({
            externalAgentId: id,
            allowedExternalAgentId: externalAgentId,
          });
        }

        if (junctionRows.length > 0) {
          await tx.insert(externalAgentAllowedSubagents).values(junctionRows);
        }
      }

      // Update allowed skills if provided
      if (allowedSkillIds !== undefined) {
        // Delete existing skill junction records
        await tx
          .delete(externalAgentAllowedSkills)
          .where(eq(externalAgentAllowedSkills.externalAgentId, id));

        // Insert new skill junction records
        if (allowedSkillIds.length > 0) {
          const skillRows = allowedSkillIds.map((skillId) => ({
            externalAgentId: id,
            skillId,
          }));
          await tx.insert(externalAgentAllowedSkills).values(skillRows);
        }
      }

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentUpdated(userId, id);

      return agent;
    });
  };
}
