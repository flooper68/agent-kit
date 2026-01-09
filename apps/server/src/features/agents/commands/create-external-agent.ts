import type { db as DbType } from '../../../db';
import {
  externalAgents,
  externalAgentAllowedSubagents,
  type ExternalAgent,
} from '../../../db/schema';
import { generateSecretKey, hashSecretKey, generateKeyPrefix } from '../utils';
import type { AllowedSubagentsInput } from './create-server-agent';

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
  constructor(private db: typeof DbType) {}

  async execute(
    input: CreateExternalAgentInput
  ): Promise<CreateExternalAgentResult> {
    const secretKey = generateSecretKey();
    const secretKeyHash = hashSecretKey(secretKey);
    const secretKeyPrefix = generateKeyPrefix(secretKey);

    const [agent] = await this.db
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

    if (!agent) {
      throw new Error('Failed to create external agent');
    }

    // Insert allowed subagents into junction table
    const allowedSubagents = input.allowedSubagents;
    if (allowedSubagents) {
      const junctionRows: Array<{
        externalAgentId: string;
        allowedServerAgentId?: string;
        allowedExternalAgentId?: string;
      }> = [];

      // Add server agent references
      for (const serverAgentId of allowedSubagents.serverAgentIds ?? []) {
        junctionRows.push({
          externalAgentId: agent.id,
          allowedServerAgentId: serverAgentId,
        });
      }

      // Add external agent references
      for (const externalAgentId of allowedSubagents.externalAgentIds ?? []) {
        junctionRows.push({
          externalAgentId: agent.id,
          allowedExternalAgentId: externalAgentId,
        });
      }

      if (junctionRows.length > 0) {
        await this.db
          .insert(externalAgentAllowedSubagents)
          .values(junctionRows);
      }
    }

    // Return plaintext key - this is the only time it's available
    return { agent, secretKey };
  }
}
