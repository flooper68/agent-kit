import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';

export const toggleAgentFavoriteMetadata: ActionMetadata = {
  id: 'toggleAgentFavorite',
  requiredScopes: [AgentScope.AGENTS_MANAGE],
  needsApproval: true,
};

export interface ToggleAgentFavoriteContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createToggleAgentFavoriteTool(
  context: ToggleAgentFavoriteContext
): Tool {
  return tool({
    description:
      'Set an agent as a favorite or remove it from favorites. Favorite agents appear at the top of the agent selector.',
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
      isFavorite: z
        .boolean()
        .describe(
          'Set to true to mark as favorite, false to remove from favorites'
        ),
    }),
    execute: async ({
      agentKey,
      agentType,
      isFavorite,
    }: {
      agentKey: string;
      agentType: 'external' | 'server';
      isFavorite: boolean;
    }) => {
      try {
        // Look up agent by key to get the ID
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

        const agent = await context.agentsFeature.customAgents.toggleFavorite(
          agentId,
          context.userId,
          isFavorite,
          agentType
        );

        if (!agent) {
          return {
            success: false,
            error: `Agent not found: ${agentKey}`,
          };
        }

        return {
          success: true,
          message: isFavorite
            ? 'Agent marked as favorite'
            : 'Agent removed from favorites',
          agent: {
            id: agent.id,
            name: 'name' in agent ? agent.name : undefined,
            isFavorite: agent.isFavorite,
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to update favorite status: ${message}`,
        };
      }
    },
  });
}
