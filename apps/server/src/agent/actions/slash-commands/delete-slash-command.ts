/**
 * deleteSlashCommand action
 *
 * Delete a slash command permanently.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SlashCommandsFeature } from '../../../features/slash-commands';
import { logger } from '../../../logger/logger';

export const deleteSlashCommandMetadata: ActionMetadata = {
  id: 'deleteSlashCommand',
  requiredScopes: [AgentScope.SLASH_COMMANDS_DELETE],
  needsApproval: true,
};

const log = logger.child({ module: 'delete-slash-command-action' });

/**
 * Context for delete slash command action
 */
export interface DeleteSlashCommandContext {
  userId: string;
  orgId: string;
  slashCommandsFeature: SlashCommandsFeature;
}

/**
 * Create the deleteSlashCommand action
 */
export function createDeleteSlashCommandTool(
  context: DeleteSlashCommandContext
): Tool {
  return tool({
    description: `Delete a slash command permanently.

This action cannot be undone. The command will no longer be available for use.
Use listSlashCommands or getSlashCommand first to find the command ID.`,

    inputSchema: z
      .object({
        id: z
          .string()
          .trim()
          .uuid()
          .transform((id) => id.toLowerCase())
          .describe('The slash command ID to delete'),
      })
      .strict(),

    execute: async ({ id }: { id: string }) => {
      log.info('Deleting slash command', { id });

      try {
        const command = await context.slashCommandsFeature.delete({
          userId: context.userId,
          orgId: context.orgId,
          id,
        });

        if (!command) {
          log.warn('Slash command not found for deletion', { id });
          return {
            success: false,
            error: `Slash command with ID ${id} not found`,
          };
        }

        log.info('Slash command deleted', {
          commandId: command.id,
          key: command.key,
        });

        return {
          success: true,
          deletedCommand: {
            id: command.id,
            key: command.key,
            name: command.name,
          },
          message: `Slash command "/${command.key}" has been permanently deleted.`,
        };
      } catch (error) {
        log.error('Error deleting slash command', { error, id });
        return {
          success: false,
          error: 'Failed to delete slash command',
        };
      }
    },
  });
}
