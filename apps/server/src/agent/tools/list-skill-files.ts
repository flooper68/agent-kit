/**
 * listSkillFiles tool
 *
 * List all files within a skill. Agents use this to discover what
 * reference documentation is available after reading the main SKILL.md.
 *
 * Examples:
 *   listSkillFiles({ skillKey: "web-research" })
 *   listSkillFiles({ skillKey: "project-management" })
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';
import { logger } from '../logger';
import { SERVER_TOOL_DEFINITIONS } from '@agent-kit/shared';

const log = logger.child({ module: 'list-skill-files-tool' });

/**
 * Context for list skill files tool
 */
export interface ListSkillFilesToolContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  /** Allowed skill IDs for this agent (empty = no skills) */
  allowedSkillIds: string[];
}

/**
 * File info returned by the tool
 */
export interface SkillFileInfo {
  path: string;
  lineCount: number;
}

/**
 * Result of listing skill files
 */
export interface ListSkillFilesResult {
  success: true;
  skillKey: string;
  skillName: string;
  files: SkillFileInfo[];
}

/**
 * Get line count for a string
 */
function getLineCount(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Create the listSkillFiles tool
 *
 * Lists all files within a skill for gradual disclosure.
 * Agent reads SKILL.md first, then uses this to find reference files.
 */
export function createListSkillFilesTool(
  context: ListSkillFilesToolContext
): Tool {
  return tool({
    // Use shared description from @agent-kit/shared (single source of truth)
    description: SERVER_TOOL_DEFINITIONS.listSkillFiles.description,
    // Schema inlined to avoid TypeScript recursion issues with AI SDK type inference
    inputSchema: z.object({
      skillKey: z
        .string()
        .min(1)
        .describe('The skill key to list files for (e.g., "web-research")'),
    }),

    execute: async ({
      skillKey,
    }: {
      skillKey: string;
    }): Promise<ListSkillFilesResult | { success: false; error: string }> => {
      log.info('Listing skill files', { skillKey });

      try {
        // Check if any skills are allowed
        if (context.allowedSkillIds.length === 0) {
          log.info('No skills allowed for this agent');
          return {
            success: false,
            error:
              'No skills are available. This agent has no skills configured.',
          };
        }

        // Find the skill from database
        const skill = await context.skillsFeature.getByKey({
          key: skillKey,
          userId: context.userId,
          orgId: context.orgId,
        });

        if (!skill) {
          // Get all available skills to show in error
          let allSkills = await context.skillsFeature.getAll({
            userId: context.userId,
            orgId: context.orgId,
          });
          // Filter to only allowed skills
          allSkills = allSkills.filter((s) =>
            context.allowedSkillIds.includes(s.id)
          );
          const availableKeys = allSkills.map((s) => s.key).join(', ');
          log.warn('Skill not found', { skillKey, availableKeys });
          return {
            success: false,
            error: `Skill "${skillKey}" not found. Available skills: ${availableKeys}`,
          };
        }

        // Check if this skill is allowed
        if (!context.allowedSkillIds.includes(skill.id)) {
          let allSkills = await context.skillsFeature.getAll({
            userId: context.userId,
            orgId: context.orgId,
          });
          allSkills = allSkills.filter((s) =>
            context.allowedSkillIds.includes(s.id)
          );
          const availableKeys = allSkills.map((s) => s.key).join(', ');
          log.warn('Skill not allowed', { skillKey, availableKeys });
          return {
            success: false,
            error: `Skill "${skillKey}" is not available. Available skills: ${availableKeys}`,
          };
        }

        // Get file list with line counts
        const files = skill.files as Array<{ path: string; content: string }>;
        const fileInfos: SkillFileInfo[] = files.map((f) => ({
          path: f.path,
          lineCount: getLineCount(f.content),
        }));

        log.info('Listed skill files', {
          skillKey,
          fileCount: fileInfos.length,
        });

        return {
          success: true,
          skillKey: skill.key,
          skillName: skill.name,
          files: fileInfos,
        };
      } catch (error) {
        log.error('Error listing skill files', { error });
        return {
          success: false,
          error: 'Failed to list skill files',
        };
      }
    },
  });
}
