import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { AgentsFeature } from '../../../features/agents';

export const deleteAgentMetadata: ActionMetadata = {
  id: 'deleteAgent',
  requiredScopes: [AgentScope.AGENTS_MANAGE],
  needsApproval: true,
};

export interface DeleteAgentContext {
  userId: string;
  agentsFeature: AgentsFeature;
}

export function createDeleteAgentTool(context: DeleteAgentContext): Tool {
  return tool({
    description:
      'Delete an agent by its key. This performs a soft delete - the agent is hidden from lists but data is preserved.',
    inputSchema: z.object({
      agentKey: z
        .string()
        .min(1)
        .max(64)
        .describe('The unique key/slug of the agent to delete'),
      agentType: z
        .enum(['server', 'external'])
        .describe('The type of agent being deleted'),
    }),
    execute: async ({
      agentKey,
      agentType,
    }: {
      agentKey: string;
      agentType: 'server' | 'external';
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
        const agentName = agentResult.agent.name;

        // Delete the agent (soft delete)
        const deletedAgent = await context.agentsFeature.customAgents.delete(
          agentId,
          context.userId,
          agentType
        );

        if (!deletedAgent) {
          return {
            success: false,
            error: `Failed to delete ${agentType} agent: ${agentKey}`,
          };
        }

        return {
          success: true,
          message: `Agent "${agentName}" (${agentKey}) deleted successfully`,
          deletedAgent: {
            id: deletedAgent.id,
            key: 'key' in deletedAgent ? deletedAgent.key : agentKey,
            name: deletedAgent.name,
            type: agentType,
            deletedAt: deletedAgent.deletedAt?.toISOString(),
          },
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to delete agent: ${message}`,
        };
      }
    },
  });
}
