import { eq, and } from 'drizzle-orm';
import {
  serverAgents,
  serverAgentAllowedSubagents,
  serverAgentAllowedSkills,
  type ServerAgent,
  type ThinkingConfig,
} from '../../../db/schema';
import { type Provider } from '../../../agent/providers/model-config';
import {
  validateAgentConfiguration,
  AgentValidationError,
} from '../../../agent/validation';
import {
  type AgentsCommandContextManager,
  type AllowedSubagentsInput,
  validateAllowedSubagentsOwnership,
  validateAllowedSkillsAccess,
} from '../context';

export interface UpdateServerAgentInput {
  id: string;
  userId: string;
  orgId: string;
  updates: {
    key?: string;
    name?: string;
    description?: string;
    // Agent configuration
    provider?: Provider;
    model?: string;
    systemPrompt?: string;
    tools?: string[];
    // Model settings
    temperature?: number | null;
    maxOutputTokens?: number | null;
    maxContextTokens?: number | null;
    thinkingConfig?: ThinkingConfig | null;
    // User preferences
    isFavorite?: boolean;
    // Sub-agent permissions
    allowedSubagents?: AllowedSubagentsInput;
    // Skill permissions
    allowedSkillIds?: string[];
    // Agent scopes (permissions for actions)
    scopes?: string[];
  };
}

export type UpdateServerAgentResult = ServerAgent | null;

/**
 * Update a server agent's configuration.
 * Validates model/provider compatibility and tool IDs before update.
 */
export class UpdateServerAgentCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: UpdateServerAgentInput
  ): Promise<UpdateServerAgentResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const { id, userId, updates } = input;

      // Extract allowedSubagents and allowedSkillIds - we handle them separately via junction tables
      const { allowedSubagents, allowedSkillIds, ...dbUpdates } = updates;

      // Validate agent configuration
      const validationResult = validateAgentConfiguration({
        provider: updates.provider,
        model: updates.model,
        tools: updates.tools,
        thinkingConfig: updates.thinkingConfig,
        maxOutputTokens: updates.maxOutputTokens,
        maxContextTokens: updates.maxContextTokens,
      });

      if (!validationResult.valid) {
        throw new AgentValidationError(validationResult);
      }

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

      const [agent] = await tx
        .update(serverAgents)
        .set({
          ...dbUpdates,
          updatedAt: new Date(),
        })
        .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
        .returning();

      if (!agent) {
        return null;
      }

      // Update allowed subagents if provided
      if (allowedSubagents !== undefined) {
        // Delete existing junction records
        await tx
          .delete(serverAgentAllowedSubagents)
          .where(eq(serverAgentAllowedSubagents.serverAgentId, id));

        // Insert new junction records
        const junctionRows: Array<{
          serverAgentId: string;
          allowedServerAgentId?: string;
          allowedExternalAgentId?: string;
        }> = [];

        for (const serverAgentId of allowedSubagents.serverAgentIds ?? []) {
          junctionRows.push({
            serverAgentId: id,
            allowedServerAgentId: serverAgentId,
          });
        }

        for (const externalAgentId of allowedSubagents.externalAgentIds ?? []) {
          junctionRows.push({
            serverAgentId: id,
            allowedExternalAgentId: externalAgentId,
          });
        }

        if (junctionRows.length > 0) {
          await tx.insert(serverAgentAllowedSubagents).values(junctionRows);
        }
      }

      // Update allowed skills if provided
      if (allowedSkillIds !== undefined) {
        // Delete existing skill junction records
        await tx
          .delete(serverAgentAllowedSkills)
          .where(eq(serverAgentAllowedSkills.serverAgentId, id));

        // Insert new skill junction records
        if (allowedSkillIds.length > 0) {
          const skillRows = allowedSkillIds.map((skillId) => ({
            serverAgentId: id,
            skillId,
          }));
          await tx.insert(serverAgentAllowedSkills).values(skillRows);
        }
      }

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentUpdated(userId, id);

      return agent;
    });
  };
}
