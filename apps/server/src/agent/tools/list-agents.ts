import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { AgentsFeature } from '../../features/agents';

export interface ListAgentsContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createListAgentsTool(context: ListAgentsContext): Tool {
  return tool({
    description:
      'List all agents available to the user. Returns agent names, descriptions, and configuration summary.',
    inputSchema: z.object({
      type: z
        .enum(['external', 'server', 'all'])
        .default('all')
        .describe(
          'Filter by agent type: external (WebSocket-based), server (LLM-based), or all'
        ),
      includeDisabled: z
        .boolean()
        .default(false)
        .describe('Include disabled agents in the list'),
    }),
    execute: async ({
      type,
      includeDisabled,
    }: {
      type?: 'external' | 'server' | 'all';
      includeDisabled?: boolean;
    }) => {
      const agentType = type ?? 'all';
      const showDisabled = includeDisabled ?? false;

      const result = await context.agentsFeature.customAgents.list(
        context.userId
      );

      // Build combined list with type discriminator
      const agents: Array<{
        id: string;
        key: string;
        name: string;
        description: string | null;
        type: 'external' | 'server';
        disabled: boolean;
        isFavorite: boolean;
        createdAt: Date;
        provider?: string;
        model?: string;
      }> = [];

      // Add external agents if requested
      if (agentType === 'all' || agentType === 'external') {
        for (const agent of result.external) {
          if (!showDisabled && agent.disabled) continue;
          agents.push({
            id: agent.id,
            key: agent.key,
            name: agent.name,
            description: agent.description,
            type: 'external',
            disabled: agent.disabled,
            isFavorite: agent.isFavorite,
            createdAt: agent.createdAt,
          });
        }
      }

      // Add server agents if requested
      if (agentType === 'all' || agentType === 'server') {
        for (const agent of result.server) {
          if (!showDisabled && agent.disabled) continue;
          agents.push({
            id: agent.id,
            key: agent.key,
            name: agent.name,
            description: agent.description,
            type: 'server',
            disabled: agent.disabled,
            isFavorite: agent.isFavorite,
            createdAt: agent.createdAt,
            provider: agent.provider,
            model: agent.model,
          });
        }
      }

      // Sort by favorite first, then by creation date (newest first)
      agents.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return {
        agents: agents.map((a) => ({
          id: a.id,
          key: a.key,
          name: a.name,
          description: a.description,
          type: a.type,
          disabled: a.disabled,
          isFavorite: a.isFavorite,
          createdAt: a.createdAt.toISOString(),
          ...(a.provider && { provider: a.provider }),
          ...(a.model && { model: a.model }),
        })),
        total: agents.length,
      };
    },
  });
}
