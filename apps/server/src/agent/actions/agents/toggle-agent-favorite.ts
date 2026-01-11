import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { AgentsFeature } from '../../../features/agents';

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
      agentId: z.string().uuid().describe('The unique ID of the agent'),
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
      agentId,
      agentType,
      isFavorite,
    }: {
      agentId: string;
      agentType: 'external' | 'server';
      isFavorite: boolean;
    }) => {
      try {
        const agent = await context.agentsFeature.customAgents.toggleFavorite(
          agentId,
          context.userId,
          isFavorite,
          agentType
        );

        if (!agent) {
          return {
            success: false,
            error: `Agent with ID ${agentId} not found`,
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
