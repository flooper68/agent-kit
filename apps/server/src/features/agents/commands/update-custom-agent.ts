import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  serverAgents,
  type ServerAgent,
  type ThinkingConfig,
} from '../../../db/schema';
import { type Provider } from '../../../agent/model-config';
import {
  validateAgentConfiguration,
  AgentValidationError,
} from '../../../agent/validation';

export interface UpdateCustomAgentInput {
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
  };
}

export type UpdateCustomAgentResult = ServerAgent | null;

/**
 * Update a server agent's configuration.
 * Validates model/provider compatibility and tool IDs before update.
 */
export class UpdateCustomAgentCommand {
  constructor(private db: typeof DbType) {}

  async execute(
    input: UpdateCustomAgentInput
  ): Promise<UpdateCustomAgentResult> {
    const { id, userId, updates } = input;

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
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(serverAgents.id, id), eq(serverAgents.userId, userId)))
      .returning();

    return agent ?? null;
  }
}
