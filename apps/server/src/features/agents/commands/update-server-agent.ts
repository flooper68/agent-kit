import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  serverAgentAllowedSubagents,
  type ServerAgent,
  type ThinkingConfig,
} from '../../../db/schema';
import { type Provider } from '../../../agent/model-config';
import {
  validateAgentConfiguration,
  AgentValidationError,
} from '../../../agent/validation';
import type { AllowedSubagentsInput } from './create-server-agent';

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
  constructor(private db: typeof DbType) {}

  async execute(
    input: UpdateServerAgentInput
  ): Promise<UpdateServerAgentResult> {
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

    const [agent] = await this.db
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
      await this.db
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
        await this.db.insert(serverAgentAllowedSubagents).values(junctionRows);
      }
    }

    return agent;
  }
}
