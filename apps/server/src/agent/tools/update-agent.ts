import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { AgentsFeature } from '../../features/agents';
import type { ThinkingConfig } from '../../db/schema/agents';

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
      "Update an agent's configuration. For server agents, you can update name, description, model settings, tools, and system prompt. External agents can only have their status changed via setAgentEnabled tool.",
    inputSchema: z.object({
      agentId: z.string().uuid().describe('The unique ID of the agent'),
      agentType: z
        .enum(['server'])
        .describe(
          'The type of agent. Only server agents support full updates.'
        ),
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
      agentId,
      agentType,
      updates,
    }: {
      agentId: string;
      agentType: 'server';
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
      if (agentType !== 'server') {
        return {
          success: false,
          error:
            'Only server agents support full configuration updates. Use setAgentEnabled or toggleAgentFavorite for external agents.',
        };
      }

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
            error: `Server agent with ID ${agentId} not found`,
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
