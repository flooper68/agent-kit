import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';

export const setAgentEnabledMetadata: ActionMetadata = {
  id: 'setAgentEnabled',
  requiredScopes: [AgentScope.AGENTS_MANAGE],
  needsApproval: true,
};

export interface SetAgentEnabledContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createSetAgentEnabledTool(
  context: SetAgentEnabledContext
): Tool {
  return tool({
    description:
      'Enable or disable an agent. Disabled agents will not appear in the agent selector and cannot be used for new sessions.',
    inputSchema: z.object({
      agentId: z.string().uuid().describe('The unique ID of the agent'),
      agentType: z
        .enum(['external', 'server'])
        .describe(
          'The type of agent: external (WebSocket-based) or server (LLM-based)'
        ),
      enabled: z
        .boolean()
        .describe('Set to true to enable the agent, false to disable'),
    }),
    execute: async ({
      agentId,
      agentType,
      enabled,
    }: {
      agentId: string;
      agentType: 'external' | 'server';
      enabled: boolean;
    }) => {
      try {
        const agent = await context.agentsFeature.customAgents.setDisabled(
          agentId,
          context.userId,
          !enabled, // setDisabled expects disabled flag, we expose enabled
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
          message: enabled
            ? 'Agent enabled successfully'
            : 'Agent disabled successfully',
          agent: {
            id: agent.id,
            name: 'name' in agent ? agent.name : undefined,
            disabled: agent.disabled,
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to update agent status: ${message}`,
        };
      }
    },
  });
}
