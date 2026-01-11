import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { AgentsFeature } from '../../../features/agents';

export interface GetAgentContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createGetAgentTool(context: GetAgentContext): Tool {
  return tool({
    description:
      'Get detailed information about a specific agent by ID. Returns full agent configuration including tools and settings.',
    inputSchema: z.object({
      agentId: z.string().uuid().describe('The unique ID of the agent'),
      agentType: z
        .enum(['external', 'server'])
        .describe(
          'The type of agent: external (WebSocket-based) or server (LLM-based)'
        ),
    }),
    execute: async ({
      agentId,
      agentType,
    }: {
      agentId: string;
      agentType: 'external' | 'server';
    }) => {
      const result = await context.agentsFeature.customAgents.list(
        context.userId
      );

      if (agentType === 'external') {
        const agent = result.external.find((a) => a.id === agentId);
        if (!agent) {
          return {
            success: false,
            error: `External agent with ID ${agentId} not found`,
          };
        }
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

      // Server agent
      const agent = result.server.find((a) => a.id === agentId);
      if (!agent) {
        return {
          success: false,
          error: `Server agent with ID ${agentId} not found`,
        };
      }
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
