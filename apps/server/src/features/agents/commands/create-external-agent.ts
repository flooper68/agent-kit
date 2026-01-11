import {
  externalAgents,
  externalAgentAllowedSubagents,
  externalAgentAllowedSkills,
  type ExternalAgent,
} from '../../../db/schema';
import { generateSecretKey, hashSecretKey, generateKeyPrefix } from '../utils';
import {
  type AgentsCommandContextManager,
  type AllowedSubagentsInput,
  validateAllowedSubagentsOwnership,
  validateAllowedSkillsAccess,
} from '../context';

/**
 * Input for creating an external agent.
 * Minimal - external agents run externally and don't need server configuration.
 */
export interface CreateExternalAgentInput {
  userId: string;
  orgId: string;
  key: string;
  name: string;
  description?: string;
  isFavorite?: boolean;
  // Sub-agent permissions
  allowedSubagents?: AllowedSubagentsInput;
  // Skill permissions
  allowedSkillIds?: string[];
  // Allowed tools - which server tools this agent can use
  allowedTools?: string[];
  // Agent scopes (permissions for actions)
  scopes?: string[];
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
      await validateAllowedSubagentsOwnership(
        tx,
        input.userId,
        allowedSubagents
      );

      // Validate skill IDs exist and are accessible
      await validateAllowedSkillsAccess(
        tx,
        input.allowedSkillIds ?? [],
        input.userId,
        input.orgId
      );

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
          allowedTools: input.allowedTools ?? [],
          scopes: input.scopes ?? [],
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

      // Insert allowed skills into junction table
      if (input.allowedSkillIds && input.allowedSkillIds.length > 0) {
        const skillRows = input.allowedSkillIds.map((skillId) => ({
          externalAgentId: createdAgent.id,
          skillId,
        }));
        await tx.insert(externalAgentAllowedSkills).values(skillRows);
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
