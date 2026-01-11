import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { AgentsFeature } from '../../features/agents';
import { setAgentEnabledSchema } from '@agent-kit/shared';

export interface SetAgentEnabledContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createSetAgentEnabledAction(
  context: SetAgentEnabledContext
): Tool {
  return tool({
    description:
      'Enable or disable an agent. Disabled agents will not appear in the agent selector and cannot be used for new sessions.',
    inputSchema: setAgentEnabledSchema,
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
