/**
 * getSlashCommand action
 *
 * Get a specific slash command by ID.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SlashCommandsFeature } from '../../../features/slash-commands';

export const getSlashCommandMetadata: ActionMetadata = {
  id: 'getSlashCommand',
  requiredScopes: [AgentScope.SLASH_COMMANDS_READ],
};

/**
 * Context for get slash command action
 */
export interface GetSlashCommandContext {
  userId: string;
  orgId: string;
  slashCommandsFeature: SlashCommandsFeature;
}

/**
 * Create the getSlashCommand action
 */
export function createGetSlashCommandTool(
  context: GetSlashCommandContext
): Tool {
  return tool({
    description: `Get a specific slash command by ID.

Returns the full command details including the prompt template.
Use listSlashCommands first to find the command ID.`,

    inputSchema: z.object({
      id: z.string().uuid().describe('The slash command ID to retrieve'),
    }),

    execute: async ({ id }: { id: string }) => {
      const command = await context.slashCommandsFeature.getById({
        userId: context.userId,
        orgId: context.orgId,
        id,
      });

      if (!command) {
        return {
          found: false,
          error: `Slash command with ID ${id} not found`,
        };
      }

      return {
        found: true,
        command: {
          id: command.id,
          key: command.key,
          name: command.name,
          description: command.description,
          prompt: command.prompt,
          createdAt: command.createdAt.toISOString(),
          updatedAt: command.updatedAt.toISOString(),
        },
      };
    },
  });
}
