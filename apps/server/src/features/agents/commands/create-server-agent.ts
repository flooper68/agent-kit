import type { db as DbType } from '../../../db';
import {
  serverAgents,
  serverAgentAllowedSubagents,
  type ServerAgent,
  type ThinkingConfig,
} from '../../../db/schema';
import {
  type Provider,
  getDefaultModelForProvider,
} from '../../../agent/model-config';
import {
  validateAgentConfiguration,
  AgentValidationError,
} from '../../../agent/validation';

/**
 * Allowed subagents configuration - IDs of agents that can be spawned
 */
export interface AllowedSubagentsInput {
  serverAgentIds?: string[];
  externalAgentIds?: string[];
}

/**
 * Input for creating a server agent.
 * Full configuration - server agents run on the server and need model configuration.
 */
export interface CreateServerAgentInput {
  userId: string;
  key: string;
  name: string;
  description?: string;
  // Agent configuration
  provider?: Provider;
  model?: string;
  systemPrompt?: string;
  tools?: string[];
  // Model settings
  temperature?: number;
  maxOutputTokens?: number;
  maxContextTokens?: number; // null/undefined = use model's default contextWindow
  thinkingConfig?: ThinkingConfig | null;
  // User preferences
  isFavorite?: boolean;
  // Sub-agent permissions
  allowedSubagents?: AllowedSubagentsInput;
}

export type CreateServerAgentResult = ServerAgent;

/**
 * Create a new server agent (runs on server).
 * These agents are created via Agent Builder.
 * Validates model/provider compatibility and tool IDs before creation.
 */
export class CreateServerAgentCommand {
  constructor(private db: typeof DbType) {}

  async execute(
    input: CreateServerAgentInput
  ): Promise<CreateServerAgentResult> {
    // Validate agent configuration
    const validationResult = validateAgentConfiguration({
      provider: input.provider,
      model: input.model,
      tools: input.tools,
      thinkingConfig: input.thinkingConfig,
      maxOutputTokens: input.maxOutputTokens,
      maxContextTokens: input.maxContextTokens,
    });

    if (!validationResult.valid) {
      throw new AgentValidationError(validationResult);
    }

    const provider = input.provider ?? 'anthropic';
    const [agent] = await this.db
      .insert(serverAgents)
      .values({
        userId: input.userId,
        key: input.key,
        name: input.name,
        description: input.description,
        // Agent configuration
        provider,
        model: input.model ?? getDefaultModelForProvider(provider),
        systemPrompt: input.systemPrompt ?? 'You are a helpful AI assistant.',
        tools: input.tools ?? [],
        // Model settings
        temperature: input.temperature,
        maxOutputTokens: input.maxOutputTokens,
        maxContextTokens: input.maxContextTokens,
        thinkingConfig: input.thinkingConfig,
        // User preferences
        isFavorite: input.isFavorite ?? false,
      })
      .returning();

    if (!agent) {
      throw new Error('Failed to create server agent');
    }

    // Insert allowed subagents into junction table
    const allowedSubagents = input.allowedSubagents;
    if (allowedSubagents) {
      const junctionRows: Array<{
        serverAgentId: string;
        allowedServerAgentId?: string;
        allowedExternalAgentId?: string;
      }> = [];

      // Add server agent references
      for (const serverAgentId of allowedSubagents.serverAgentIds ?? []) {
        junctionRows.push({
          serverAgentId: agent.id,
          allowedServerAgentId: serverAgentId,
        });
      }

      // Add external agent references
      for (const externalAgentId of allowedSubagents.externalAgentIds ?? []) {
        junctionRows.push({
          serverAgentId: agent.id,
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
