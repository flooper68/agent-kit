import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../shared/types';
import type { AgentSpawner } from '../shared/spawner';
import { SPAWN_CONFIG } from '../shared/spawn-config';
import { logger } from '../shared/logger';
import { SERVER_TOOL_DEFINITIONS } from '@agent-kit/shared';

const log = logger.child({ module: 'spawn-agent-tool' });

export interface SpawnAgentContext {
  userId: string;
  orgId: string;
  sessionId: string;
  currentSpawnDepth: number;
  agentSpawner: AgentSpawner;
  /** Message ID for the current assistant message (for spawn_session_created event) */
  messageId: string;
  /** Key of the parent agent making the spawn request (for allowlist validation) */
  parentAgentKey?: string;
}

/**
 * Result type for the spawnAgent tool (errors are thrown, not returned)
 */
export type SpawnAgentToolResult = {
  success: true;
  sessionId: string;
  response: string;
  agentName?: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export function createSpawnAgentTool(context: SpawnAgentContext): Tool {
  return tool({
    // Use shared description from @agent-kit/shared (single source of truth)
    description: SERVER_TOOL_DEFINITIONS.spawnAgent.description,
    // Schema inlined to avoid TypeScript recursion issues with AI SDK type inference
    inputSchema: z.object({
      agentId: z
        .string()
        .min(1, 'Agent ID is required')
        .max(64, 'Agent ID must be 64 characters or less')
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          'Agent ID can only contain letters, numbers, underscores, and hyphens'
        )
        .describe('ID of the agent to spawn'),
      message: z
        .string()
        .min(1, 'Message is required')
        .max(50000, 'Message must be 50,000 characters or less')
        .describe('The task/message to send to the spawned agent'),
    }),
    execute: async (
      {
        agentId,
        message,
      }: {
        agentId: string;
        message: string;
      },
      { toolCallId }: { toolCallId: string }
    ): Promise<SpawnAgentToolResult> => {
      // Check spawn depth limit
      if (context.currentSpawnDepth >= SPAWN_CONFIG.MAX_SPAWN_DEPTH) {
        throw new Error(
          `Maximum spawn depth of ${SPAWN_CONFIG.MAX_SPAWN_DEPTH} exceeded. Cannot spawn more agents from this context.`
        );
      }

      try {
        const result = await context.agentSpawner.spawnAndWait({
          agentId,
          message,
          userId: context.userId,
          orgId: context.orgId,
          parentSessionId: context.sessionId,
          parentSpawnDepth: context.currentSpawnDepth,
          toolCallId,
          messageId: context.messageId,
          parentAgentKey: context.parentAgentKey,
        });

        if (result.finishReason === 'error') {
          throw new Error(result.error ?? 'Spawned agent encountered an error');
        }

        if (result.finishReason === 'timeout') {
          throw new Error(result.error ?? 'Spawned agent timed out');
        }

        if (result.finishReason === 'interrupted') {
          throw new Error('Spawned agent was interrupted');
        }

        return {
          success: true,
          sessionId: result.sessionId,
          response: result.response,
          agentName: result.agentName,
          usage: result.usage,
        };
      } catch (error) {
        log.error('Failed to spawn agent', {
          agentId,
          sessionId: context.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}
