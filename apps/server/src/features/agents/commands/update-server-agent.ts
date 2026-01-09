import { eq, and, inArray, isNull } from 'drizzle-orm';
import {
  serverAgents,
  serverAgentAllowedSubagents,
  externalAgents,
  type ServerAgent,
  type ThinkingConfig,
} from '../../../db/schema';
import { type Provider } from '../../../agent/model-config';
import {
  validateAgentConfiguration,
  AgentValidationError,
} from '../../../agent/validation';
import type { AllowedSubagentsInput } from './create-server-agent';
import type { AgentsCommandContextManager } from '../context';

export interface UpdateServerAgentInput {
  id: string;
  userId: string;
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

      // Extract allowedSubagents - we handle it separately via junction table
      const { allowedSubagents, ...dbUpdates } = updates;

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
      if (allowedSubagents?.serverAgentIds?.length) {
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
          (aid) => !validIds.has(aid)
        );
        if (invalidIds.length > 0) {
          throw new Error(
            `Invalid or inaccessible server agents: ${invalidIds.join(', ')}`
          );
        }
      }

      if (allowedSubagents?.externalAgentIds?.length) {
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
          (aid) => !validIds.has(aid)
        );
        if (invalidIds.length > 0) {
          throw new Error(
            `Invalid or inaccessible external agents: ${invalidIds.join(', ')}`
          );
        }
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

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentUpdated(userId, id);

      return agent;
    });
  };
}
