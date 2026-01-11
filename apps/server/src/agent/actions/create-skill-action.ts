/**
 * createSkill action
 *
 * Create a new user skill with documentation files.
 * System skills cannot be created through this action - only user skills.
 */

import { tool } from 'ai';
import type { Tool } from '../shared/types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../shared/logger';
import { createSkillSchema } from '@agent-kit/shared';

const log = logger.child({ module: 'create-skill-action' });

/**
 * Context for create skill action
 */
export interface CreateSkillActionContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Create the createSkill action
 */
export function createCreateSkillAction(context: CreateSkillActionContext): Tool {
  return tool({
    description: `Create a new user skill with documentation files.

Skills are documentation bundles that teach agents how to use related tools.
Each skill should have at least a SKILL.md file with instructions.

Note: Only user skills can be created. System skills are read-only.`,

    inputSchema: createSkillSchema,

    execute: async ({
      key,
      name,
      description,
      files,
    }: {
      key: string;
      name: string;
      description: string;
      files: Array<{ path: string; content: string }>;
    }) => {
      log.info('Creating skill', { key, name, fileCount: files.length });

      try {
        // Check if skill with this key already exists before attempting insert
        const existingSkill = await context.skillsFeature.getByKey({
          key,
          userId: context.userId,
          orgId: context.orgId,
        });

        if (existingSkill) {
          log.warn('Skill with key already exists', { key });
          return {
            success: false,
            error: `A skill with key "${key}" already exists. Choose a different key.`,
          };
        }

        const skill = await context.skillsFeature.create({
          userId: context.userId,
          orgId: context.orgId,
          key,
          name,
          description,
          files,
        });

        log.info('Skill created', { skillId: skill.id, key });

        return {
          success: true,
          skill: {
            id: skill.id,
            key: skill.key,
            name: skill.name,
            description: skill.description,
            fileCount: files.length,
          },
          message: `Skill "${name}" created successfully.`,
        };
      } catch (error) {
        log.error('Error creating skill', { error, key });

        return {
          success: false,
          error: 'Failed to create skill',
        };
      }
    },
  });
}
