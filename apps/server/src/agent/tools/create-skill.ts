/**
 * createSkill tool
 *
 * Create a new user skill with documentation files.
 * System skills cannot be created through this tool - only user skills.
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../logger';
import { SkillFilePathSchema } from '../skills/types';

const log = logger.child({ module: 'create-skill-tool' });

/**
 * Context for create skill tool
 */
export interface CreateSkillToolContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * Schema for skill file input with path validation
 */
const SkillFileSchema = z.object({
  path: SkillFilePathSchema.describe(
    'File path within the skill (e.g., "SKILL.md" or "references/tips.md")'
  ),
  content: z.string().min(1).max(500_000).describe('File content (max 500KB)'),
});

/**
 * Create the createSkill tool
 */
export function createCreateSkillTool(context: CreateSkillToolContext): Tool {
  return tool({
    description: `Create a new user skill with documentation files.

Skills are documentation bundles that teach agents how to use related tools.
Each skill should have at least a SKILL.md file with instructions.

Note: Only user skills can be created. System skills are read-only.`,

    inputSchema: z.object({
      key: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/, {
          message:
            'Key must contain only lowercase letters, numbers, and hyphens',
        })
        .describe('Unique skill identifier (e.g., "my-custom-skill")'),
      name: z.string().min(1).max(255).describe('Display name for the skill'),
      description: z
        .string()
        .min(1)
        .max(1000)
        .describe('Short description for skill discovery'),
      files: z
        .array(SkillFileSchema)
        .min(1)
        .max(20)
        .describe('Documentation files (at least one, typically SKILL.md)'),
    }),

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
