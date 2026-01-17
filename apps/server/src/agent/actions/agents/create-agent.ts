import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope, ALL_SCOPES } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';
import type { ThinkingConfig } from '../../../db/schema/agents';
import { ThinkingConfigSchema } from './schemas';

export const createAgentMetadata: ActionMetadata = {
  id: 'createAgent',
  requiredScopes: [AgentScope.AGENTS_MANAGE],
  needsApproval: true,
};

export interface CreateAgentContext {
  userId: string;
  orgId: string;
  agentsFeature: AgentsFeature;
}

const AllowedSubagentsSchema = z
  .object({
    serverAgentIds: z.array(z.string()).optional(),
    externalAgentIds: z.array(z.string()).optional(),
  })
  .optional();

export function createCreateAgentTool(context: CreateAgentContext): Tool {
  return tool({
    description:
      'Create a new agent. For server agents, specify LLM configuration (provider, model, systemPrompt, tools). For external agents, specify allowedTools for server-side tools the external agent can use.',
    inputSchema: z.object({
      agentType: z
        .enum(['server', 'external'])
        .describe(
          'The type of agent: server (LLM-based, runs on server) or external (connects via WebSocket)'
        ),
      key: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .describe(
          'Unique agent key/slug (alphanumeric, hyphens, underscores only)'
        ),
      name: z.string().min(1).max(255).describe('Display name for the agent'),
      description: z
        .string()
        .max(1000)
        .optional()
        .describe('Description of the agent'),
      // Server agent specific fields
      provider: z
        .enum(['anthropic', 'openai', 'gemini'])
        .optional()
        .describe('LLM provider (server agents only, defaults to anthropic)'),
      model: z
        .string()
        .optional()
        .describe('Model ID (server agents only, must match provider)'),
      systemPrompt: z
        .string()
        .optional()
        .describe(
          'System prompt for the agent (server agents only, defaults to helpful assistant)'
        ),
      tools: z
        .array(z.string())
        .optional()
        .describe('Array of tool IDs the agent can use (server agents only)'),
      temperature: z
        .number()
        .min(0)
        .max(2)
        .nullable()
        .optional()
        .describe('Temperature setting 0-2 (server agents only)'),
      maxOutputTokens: z
        .number()
        .positive()
        .nullable()
        .optional()
        .describe('Maximum output tokens (server agents only)'),
      thinkingConfig: ThinkingConfigSchema.optional().describe(
        'Thinking/reasoning configuration (server agents only)'
      ),
      // External agent specific fields
      allowedTools: z
        .array(z.string())
        .optional()
        .describe(
          'Server-side tools this external agent can use (external agents only)'
        ),
      // Common optional fields
      isFavorite: z
        .boolean()
        .optional()
        .describe('Whether to mark as favorite (defaults to false)'),
      allowedSubagents: AllowedSubagentsSchema.describe(
        'IDs of agents this agent can spawn as subagents'
      ),
      allowedSkillIds: z
        .array(z.string())
        .optional()
        .describe('IDs of skills this agent can use'),
      scopes: z
        .array(z.enum(ALL_SCOPES as [string, ...string[]]))
        .optional()
        .describe('Permission scopes for the agent'),
    }),
    execute: async ({
      agentType,
      key,
      name,
      description,
      provider,
      model,
      systemPrompt,
      tools,
      temperature,
      maxOutputTokens,
      thinkingConfig,
      allowedTools,
      isFavorite,
      allowedSubagents,
      allowedSkillIds,
      scopes,
    }: {
      agentType: 'server' | 'external';
      key: string;
      name: string;
      description?: string;
      provider?: 'anthropic' | 'openai' | 'gemini';
      model?: string;
      systemPrompt?: string;
      tools?: string[];
      temperature?: number | null;
      maxOutputTokens?: number | null;
      thinkingConfig?: ThinkingConfig | null;
      allowedTools?: string[];
      isFavorite?: boolean;
      allowedSubagents?: {
        serverAgentIds?: string[];
        externalAgentIds?: string[];
      };
      allowedSkillIds?: string[];
      scopes?: string[];
    }) => {
      try {
        if (agentType === 'external') {
          // Validate no server agent fields are provided
          const serverOnlyFields = [
            'provider',
            'model',
            'systemPrompt',
            'tools',
            'temperature',
            'maxOutputTokens',
            'thinkingConfig',
          ] as const;
          const providedServerFields = serverOnlyFields.filter((field) => {
            const value = {
              provider,
              model,
              systemPrompt,
              tools,
              temperature,
              maxOutputTokens,
              thinkingConfig,
            }[field];
            return value !== undefined;
          });

          if (providedServerFields.length > 0) {
            return {
              success: false,
              error: `External agents do not support: ${providedServerFields.join(', ')}. These are server agent options.`,
            };
          }

          const result = await context.agentsFeature.customAgents.createExternal(
            {
              userId: context.userId,
              orgId: context.orgId,
              key,
              name,
              description,
              isFavorite,
              allowedSubagents,
              allowedSkillIds,
              allowedTools,
              scopes,
            }
          );

          // Note: We intentionally do NOT return the secretKey for security
          // The secret key is only available when creating via TRPC/UI
          return {
            success: true,
            message:
              'External agent created successfully. Important: The secret key required for this agent to connect is only available via the UI. Go to Agent Settings to retrieve the connection credentials.',
            agent: {
              id: result.agent.id,
              key: result.agent.key,
              name: result.agent.name,
              description: result.agent.description,
              type: 'external' as const,
              createdAt: result.agent.createdAt.toISOString(),
            },
          };
        }

        // Server agent
        // Validate no external agent fields are provided
        if (allowedTools !== undefined) {
          return {
            success: false,
            error:
              'Server agents do not support allowedTools. This is an external agent option.',
          };
        }

        const agent = await context.agentsFeature.customAgents.createServer({
          userId: context.userId,
          orgId: context.orgId,
          key,
          name,
          description,
          provider,
          model,
          systemPrompt,
          tools,
          temperature: temperature ?? undefined,
          maxOutputTokens: maxOutputTokens ?? undefined,
          thinkingConfig,
          isFavorite,
          allowedSubagents,
          allowedSkillIds,
          scopes,
        });

        return {
          success: true,
          message: 'Server agent created successfully',
          agent: {
            id: agent.id,
            key: agent.key,
            name: agent.name,
            description: agent.description,
            type: 'server' as const,
            provider: agent.provider,
            model: agent.model,
            createdAt: agent.createdAt.toISOString(),
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to create agent: ${message}`,
        };
      }
    },
  });
}
