import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { AgentSpawner } from '../agent-spawner';
import { SPAWN_CONFIG } from '../spawn-config';

export interface SpawnAgentContext {
  userId: string;
  orgId: string;
  sessionId: string;
  currentSpawnDepth: number;
  agentSpawner: AgentSpawner;
  /** Message ID for the current assistant message (for spawn_session_created event) */
  messageId: string;
}

/**
 * Result type for the spawnAgent tool
 */
export type SpawnAgentToolResult =
  | {
      success: true;
      sessionId: string;
      response: string;
      agentName?: string;
      usage?: { promptTokens: number; completionTokens: number };
    }
  | {
      success: false;
      error: string;
      sessionId?: string;
      partialResponse?: string;
    };

export function createSpawnAgentTool(context: SpawnAgentContext): Tool {
  return tool({
    description: `Spawn another agent to handle a specific task. The spawned agent runs in its own fresh session with only the message you provide - it does not have access to your conversation history.

Use this tool to:
- Delegate specialized tasks to other agents
- Get a second opinion or alternative approach
- Run subtasks that benefit from a clean context

The tool will wait for the spawned agent to complete and return its full response.

Available agents are listed in the system prompt under "Built-in Agents" and "Local Agents". Use the agent ID shown in bold (e.g., "assistant-opus-4.5" or "my-custom-agent").`,
    inputSchema: z.object({
      agentId: z
        .string()
        .min(1, 'Agent ID is required')
        .max(64, 'Agent ID must be 64 characters or less')
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          'Agent ID can only contain letters, numbers, underscores, and hyphens'
        )
        .describe(
          'ID of the agent to spawn (from the available agents list in system prompt)'
        ),
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
        return {
          success: false,
          error: `Maximum spawn depth of ${SPAWN_CONFIG.MAX_SPAWN_DEPTH} exceeded. Cannot spawn more agents from this context.`,
        };
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
        });

        if (result.finishReason === 'error') {
          return {
            success: false,
            error: result.error ?? 'Spawned agent encountered an error',
            sessionId: result.sessionId || undefined,
          };
        }

        if (result.finishReason === 'timeout') {
          return {
            success: false,
            error: result.error ?? 'Spawned agent timed out',
            sessionId: result.sessionId,
            partialResponse: result.response || undefined,
          };
        }

        if (result.finishReason === 'interrupted') {
          return {
            success: false,
            error: 'Spawned agent was interrupted',
            sessionId: result.sessionId,
            partialResponse: result.response || undefined,
          };
        }

        return {
          success: true,
          sessionId: result.sessionId,
          response: result.response,
          agentName: result.agentName,
          usage: result.usage,
        };
      } catch (error) {
        console.error('Failed to spawn agent:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to spawn agent. Please try again.',
        };
      }
    },
  });
}
