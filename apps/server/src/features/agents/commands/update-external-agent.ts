import { eq, and, inArray, isNull } from 'drizzle-orm';
import {
  externalAgents,
  externalAgentAllowedSubagents,
  serverAgents,
  type ExternalAgent,
} from '../../../db/schema';
import type { AllowedSubagentsInput } from './create-server-agent';
import type { AgentsCommandContextManager } from '../context';

export interface UpdateExternalAgentInput {
  id: string;
  userId: string;
  updates: {
    name?: string;
    description?: string;
    isFavorite?: boolean;
    // Sub-agent permissions
    allowedSubagents?: AllowedSubagentsInput;
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

      // Extract allowedSubagents - we handle it separately via junction table
      const { allowedSubagents, ...dbUpdates } = updates;

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

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentUpdated(userId, id);

      return agent;
    });
  };
}
