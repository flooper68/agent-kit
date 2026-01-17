import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';

export const getAgentMetadata: ActionMetadata = {
  id: 'getAgent',
  requiredScopes: [AgentScope.AGENTS_READ],
};

export interface GetAgentContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createGetAgentTool(context: GetAgentContext): Tool {
  return tool({
    description:
      'Get detailed information about a specific agent by ID. Returns full agent configuration including tools and settings.',
    inputSchema: z.object({
      agentKey: z
        .string()
        .min(1)
        .max(64)
        .describe('The unique key/slug of the agent (e.g., "main-assistant")'),
      agentType: z
        .enum(['external', 'server'])
        .describe(
          'The type of agent: external (WebSocket-based) or server (LLM-based)'
        ),
    }),
    execute: async ({
      agentKey,
      agentType,
    }: {
      agentKey: string;
      agentType: 'external' | 'server';
    }) => {
      // Look up agent by key
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

      if (agentResult.type === 'external') {
        const agent = agentResult.agent;
        return {
          success: true,
          agent: {
            id: agent.id,
            key: agent.key,
            name: agent.name,
            description: agent.description,
            type: 'external' as const,
            secretKeyPrefix: agent.secretKeyPrefix,
            disabled: agent.disabled,
            isFavorite: agent.isFavorite,
            createdAt: agent.createdAt.toISOString(),
            updatedAt: agent.updatedAt.toISOString(),
          },
        };
      }

      // Server agent (agentResult.type === 'server')
      const agent = agentResult.agent;
      return {
        success: true,
        agent: {
          id: agent.id,
          key: agent.key,
          name: agent.name,
          description: agent.description,
          type: 'server' as const,
          provider: agent.provider,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          tools: agent.tools,
          temperature: agent.temperature,
          maxOutputTokens: agent.maxOutputTokens,
          thinkingConfig: agent.thinkingConfig,
          disabled: agent.disabled,
          isFavorite: agent.isFavorite,
          createdAt: agent.createdAt.toISOString(),
          updatedAt: agent.updatedAt.toISOString(),
        },
      };
    },
  });
}
