/**
 * deleteSkill action
 *
 * Delete a user skill permanently.
 * System skills cannot be deleted through this action.
 */

import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../shared/logger';
import { deleteSkillSchema } from '@agent-kit/shared';

const log = logger.child({ module: 'delete-skill-action' });

/**
 * Context for delete skill action
 */
export interface DeleteSkillActionContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Create the deleteSkill action
 */
export function createDeleteSkillAction(context: DeleteSkillActionContext): Tool {
  return tool({
    description: `Delete a user skill permanently.

This action cannot be undone. System skills cannot be deleted - only user-created skills.`,

    inputSchema: deleteSkillSchema,

    execute: async ({ id }: { id: string }) => {
      log.info('Deleting skill', { id });

      try {
        const skill = await context.skillsFeature.delete({
          id,
          userId: context.userId,
          orgId: context.orgId,
        });

        if (!skill) {
          log.warn('Skill not found or not deletable', { id });
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
        log.error('Error deleting skill', { error, id });
        return {
          success: false,
          error: 'Failed to delete skill',
        };
      }
    },
  });
}
