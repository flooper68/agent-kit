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
import { logger } from '../../../logger/logger';

export const getSlashCommandMetadata: ActionMetadata = {
  id: 'getSlashCommand',
  requiredScopes: [AgentScope.SLASH_COMMANDS_READ],
};

const log = logger.child({ module: 'get-slash-command-action' });

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

    inputSchema: z
      .object({
        id: z
          .string()
          .trim()
          .uuid()
          .transform((id) => id.toLowerCase())
          .describe('The slash command ID to retrieve'),
      })
      .strict(),

    execute: async ({ id }: { id: string }) => {
      log.info('Fetching slash command', { id });

      try {
        const command = await context.slashCommandsFeature.getById({
          userId: context.userId,
          orgId: context.orgId,
          id,
        });

        if (!command) {
          log.warn('Slash command not found', { id });
          return {
            success: false,
            error: `Slash command with ID ${id} not found`,
          };
        }

        log.info('Slash command retrieved', {
          commandId: command.id,
          key: command.key,
        });

        return {
          success: true,
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
      } catch (error) {
        log.error('Error fetching slash command', { error, id });
        return {
          success: false,
          error: 'Failed to fetch slash command',
        };
      }
    },
  });
}
