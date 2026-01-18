/**
 * deleteSkill action
 *
 * Delete a user skill permanently.
 * System skills cannot be deleted through this action.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../types';
import type { ActionMetadata } from '../types';
import { AgentScope } from '../../permissions/scopes';
import type { SkillsFeature } from '../../../features/skills';
import { logger } from '../../../logger/logger';

export const deleteSkillMetadata: ActionMetadata = {
  id: 'deleteSkill',
  requiredScopes: [AgentScope.SKILLS_DELETE],
  needsApproval: true,
};

const log = logger.child({ module: 'delete-skill-action' });

/**
 * Context for delete skill action
 */
export interface DeleteSkillContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Create the deleteSkill action
 */
export function createDeleteSkillTool(context: DeleteSkillContext): Tool {
  return tool({
    description: `Delete a user skill permanently.

This action cannot be undone. System skills cannot be deleted - only user-created skills.`,

    inputSchema: z
      .object({
        id: z
          .string()
          .uuid()
          .optional()
          .describe('The ID of the skill to delete'),
        skillKey: z
          .string()
          .optional()
          .describe('The key of the skill to delete (alternative to id)'),
      })
      .refine((data) => data.id || data.skillKey, {
        message: 'Either id or skillKey must be provided',
      }),

    execute: async ({ id, skillKey }: { id?: string; skillKey?: string }) => {
      // Resolve skillKey to id if needed
      let resolvedId = id;
      if (!resolvedId && skillKey) {
        const skill = await context.skillsFeature.getByKey({
          key: skillKey,
          userId: context.userId,
          orgId: context.orgId,
        });
        if (!skill) {
          log.warn('Skill not found by key', { skillKey });
          return {
            success: false,
            error: `Skill with key "${skillKey}" not found`,
          };
        }
        resolvedId = skill.id;
      }

      log.info('Deleting skill', { id: resolvedId, skillKey });

      try {
        const skill = await context.skillsFeature.delete({
          id: resolvedId!,
          userId: context.userId,
          orgId: context.orgId,
        });

        if (!skill) {
          log.warn('Skill not found or not deletable', { id: resolvedId });
          return {
            success: false,
            error:
              'Skill not found or you do not have permission to delete it. Note: System skills cannot be deleted.',
          };
        }

        log.info('Skill deleted', { skillId: skill.id, key: skill.key });

        return {
          success: true,
          deletedSkill: {
            id: skill.id,
            key: skill.key,
            name: skill.name,
          },
          message: `Skill "${skill.name}" has been permanently deleted.`,
        };
      } catch (error) {
        log.error('Error deleting skill', { error, id: resolvedId });
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to delete skill: ${message}`,
        };
      }
    },
  });
}
