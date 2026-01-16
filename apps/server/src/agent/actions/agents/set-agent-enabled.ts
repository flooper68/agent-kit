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
      agentKey: z
        .string()
        .min(1)
        .max(64)
        .describe(
          'The unique key/slug of the agent (e.g., "main-assistant")'
        ),
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
      agentKey,
      agentType,
      enabled,
    }: {
      agentKey: string;
      agentType: 'external' | 'server';
      enabled: boolean;
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

        const agent = await context.agentsFeature.customAgents.setDisabled(
          agentId,
          context.userId,
          !enabled, // setDisabled expects disabled flag, we expose enabled
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
