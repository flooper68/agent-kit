import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  externalAgents,
  externalAgentAllowedSubagents,
  serverAgents,
  type ExternalAgent,
} from '../../../db/schema';
import { generateSecretKey, hashSecretKey, generateKeyPrefix } from '../utils';
import type { AllowedSubagentsInput } from './create-server-agent';
import type { AgentsCommandContextManager } from '../context';

/**
 * Input for creating an external agent.
 * Minimal - external agents run externally and don't need server configuration.
 */
export interface CreateExternalAgentInput {
  userId: string;
  key: string;
  name: string;
  description?: string;
  isFavorite?: boolean;
  // Sub-agent permissions
  allowedSubagents?: AllowedSubagentsInput;
}

export interface CreateExternalAgentResult {
  agent: ExternalAgent;
  secretKey: string;
}

/**
 * Create a new external agent with auto-generated secret key.
 * Returns the agent AND the plaintext secret key (only returned once).
 * External agents connect via WebSocket.
 */
export class CreateExternalAgentCommand {
  constructor(private readonly contextManager: AgentsCommandContextManager) {}

  execute = async (
    input: CreateExternalAgentInput
  ): Promise<CreateExternalAgentResult> => {
    return this.contextManager.handleCommand(async (ctx) => {
      const { tx, cacheInvalidation } = ctx;
      const secretKey = generateSecretKey();
      const secretKeyHash = hashSecretKey(secretKey);
      const secretKeyPrefix = generateKeyPrefix(secretKey);
      const allowedSubagents = input.allowedSubagents;

      // Validate ownership of referenced agents before creating
      if (allowedSubagents?.serverAgentIds?.length) {
        const validAgents = await tx
          .select({ id: serverAgents.id })
          .from(serverAgents)
          .where(
            and(
              inArray(serverAgents.id, allowedSubagents.serverAgentIds),
              eq(serverAgents.userId, input.userId),
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

      if (allowedSubagents?.externalAgentIds?.length) {
        const validAgents = await tx
          .select({ id: externalAgents.id })
          .from(externalAgents)
          .where(
            and(
              inArray(externalAgents.id, allowedSubagents.externalAgentIds),
              eq(externalAgents.userId, input.userId),
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

      const [createdAgent] = await tx
        .insert(externalAgents)
        .values({
          userId: input.userId,
          key: input.key,
          name: input.name,
          description: input.description,
          secretKey: secretKeyHash,
          secretKeyPrefix,
          isFavorite: input.isFavorite ?? false,
        })
        .returning();

      if (!createdAgent) {
        throw new Error('Failed to create external agent');
      }

      // Insert allowed subagents into junction table
      if (allowedSubagents) {
        const junctionRows: Array<{
          externalAgentId: string;
          allowedServerAgentId?: string;
          allowedExternalAgentId?: string;
        }> = [];

        // Add server agent references
        for (const serverAgentId of allowedSubagents.serverAgentIds ?? []) {
          junctionRows.push({
            externalAgentId: createdAgent.id,
            allowedServerAgentId: serverAgentId,
          });
        }

        // Add external agent references
        for (const externalAgentId of allowedSubagents.externalAgentIds ?? []) {
          junctionRows.push({
            externalAgentId: createdAgent.id,
            allowedExternalAgentId: externalAgentId,
          });
        }

        if (junctionRows.length > 0) {
          await tx.insert(externalAgentAllowedSubagents).values(junctionRows);
        }
      }

      // Publish cache invalidation event
      await cacheInvalidation?.publishAgentCreated(
        input.userId,
        createdAgent.id
      );

      // Return plaintext key - this is the only time it's available
      return { agent: createdAgent, secretKey };
    });
  };
}
