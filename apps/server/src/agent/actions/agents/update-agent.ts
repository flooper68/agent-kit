import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';
import type { ThinkingConfig } from '../../../db/schema/agents';

export const updateAgentMetadata: ActionMetadata = {
  id: 'updateAgent',
  requiredScopes: [AgentScope.AGENTS_MANAGE],
  needsApproval: true,
};

export interface UpdateAgentContext {
  userId: string;
  orgId: string;
  agentsFeature: AgentsFeature;
}

const ThinkingConfigSchema = z
  .object({
    enabled: z.boolean(),
    budgetTokens: z.number().min(1024).max(32768).optional(),
    reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
    thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
    thinkingBudget: z.number().min(-1).max(32768).optional(),
  })
  .nullable();

export function createUpdateAgentTool(context: UpdateAgentContext): Tool {
  return tool({
    description:
      "Update an agent's configuration. For server agents, you can update name, description, model settings, tools, and system prompt. For external agents, you can update name, description, and isFavorite.",
    inputSchema: z.object({
      agentKey: z
        .string()
        .min(1)
        .max(64)
        .describe('The unique key/slug of the agent (e.g., "main-assistant")'),
      agentType: z
        .enum(['server', 'external'])
        .describe('The type of agent being updated'),
      updates: z.object({
        key: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-zA-Z0-9_-]+$/)
          .optional()
          .describe('New unique agent key'),
        name: z.string().min(1).max(255).optional().describe('New agent name'),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe('New agent description'),
        provider: z
          .enum(['anthropic', 'openai', 'gemini'])
          .optional()
          .describe('LLM provider'),
        model: z.string().optional().describe('Model ID (must match provider)'),
        systemPrompt: z
          .string()
          .optional()
          .describe('System prompt for the agent'),
        tools: z
          .array(z.string())
          .optional()
          .describe('Array of tool IDs the agent can use'),
        temperature: z
          .number()
          .min(0)
          .max(2)
          .nullable()
          .optional()
          .describe('Temperature setting (0-2)'),
        maxOutputTokens: z
          .number()
          .positive()
          .nullable()
          .optional()
          .describe('Maximum output tokens'),
        thinkingConfig: ThinkingConfigSchema.optional().describe(
          'Thinking/reasoning configuration'
        ),
        isFavorite: z.boolean().optional().describe('Favorite status'),
      }),
    }),
    execute: async ({
      agentKey,
      agentType,
      updates,
    }: {
      agentKey: string;
      agentType: 'server' | 'external';
      updates: {
        key?: string;
        name?: string;
        description?: string;
        provider?: 'anthropic' | 'openai' | 'gemini';
        model?: string;
        systemPrompt?: string;
        tools?: string[];
        temperature?: number | null;
        maxOutputTokens?: number | null;
        thinkingConfig?: ThinkingConfig | null;
        isFavorite?: boolean;
      };
    }) => {
      // Look up agent by key to get the full agent object
      const agentResult = await context.agentsFeature.customAgents.getByKey(
        agentKey,
        context.userId
      );

      if (!agentResult || agentResult.type !== agentType) {
        return {
          success: false,
          error: `${agentType} agent not found: ${agentKey}`,
        };
      }

      const agentId = agentResult.agent.id;
      // Filter out undefined values
      const cleanedUpdates: typeof updates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          (cleanedUpdates as Record<string, unknown>)[key] = value;
        }
      }

      if (Object.keys(cleanedUpdates).length === 0) {
        return {
          success: false,
          error: 'No updates provided',
        };
      }

      // Handle external agents
      if (agentType === 'external') {
        // Validate no LLM config fields are provided for external agents
        const llmConfigFields = [
          'key',
          'provider',
          'model',
          'systemPrompt',
          'tools',
          'temperature',
          'maxOutputTokens',
          'thinkingConfig',
        ] as const;
        const invalidFields = llmConfigFields.filter(
          (field) => cleanedUpdates[field] !== undefined
        );

        if (invalidFields.length > 0) {
          return {
            success: false,
            error: `External agents do not support updating: ${invalidFields.join(', ')}. Only name, description, and isFavorite can be updated.`,
          };
        }

        try {
          const agent = await context.agentsFeature.customAgents.updateExternal(
            {
              id: agentId,
              userId: context.userId,
              orgId: context.orgId,
              updates: {
                name: cleanedUpdates.name,
                description: cleanedUpdates.description,
                isFavorite: cleanedUpdates.isFavorite,
              },
            }
          );

          if (!agent) {
            return {
              success: false,
              error: `External agent not found: ${agentKey}`,
            };
          }

          return {
            success: true,
            message: 'Agent updated successfully',
            agent: {
              id: agent.id,
              key: agent.key,
              name: agent.name,
              description: agent.description,
              updatedAt: agent.updatedAt.toISOString(),
            },
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            error: `Failed to update external agent: ${message}`,
          };
        }
      }

      // Handle server agents
      try {
        const agent = await context.agentsFeature.customAgents.update({
          id: agentId,
          userId: context.userId,
          orgId: context.orgId,
          updates: cleanedUpdates,
        });

        if (!agent) {
          return {
            success: false,
            error: `Server agent not found: ${agentKey}`,
          };
        }

        return {
          success: true,
          message: 'Agent updated successfully',
          agent: {
            id: agent.id,
            key: agent.key,
            name: agent.name,
            description: agent.description,
            provider: agent.provider,
            model: agent.model,
            updatedAt: agent.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to update agent: ${message}`,
        };
      }
    },
  });
}
