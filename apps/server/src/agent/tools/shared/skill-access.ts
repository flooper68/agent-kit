/**
 * Shared helper for skill access validation.
 *
 * Consolidates duplicate logic from list-skill-files and read-skill-file tools.
 */

import type { SkillsFeature } from '../../../features/skills';
import type { Skill } from '../../../db/schema/skills';
import { parseSkillFiles } from '../../skills/types';
import { logger } from '../../../logger/logger';

const log = logger.child({ module: 'skill-access' });

/**
 * Context required for skill access operations
 */
export interface SkillAccessContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  allowedSkillIds: string[];
}

/**
 * Successful skill access result with validated files
 */
export interface SkillAccessSuccess {
  success: true;
  skill: Skill;
  files: Array<{ path: string; content: string }>;
}

/**
 * Failed skill access result with error message
 */
export interface SkillAccessError {
  success: false;
  error: string;
}

export type SkillAccessResult = SkillAccessSuccess | SkillAccessError;

/**
 * Get line count for a string
 */
export function getLineCount(content: string): number {
  if (!content || content === '') return 0;
  return content.split('\n').length;
}

/**
 * Get a skill by key with access validation and file parsing.
 *
 * This function:
 * 1. Checks if any skills are allowed for this agent
 * 2. Fetches the skill by key
 * 3. Validates the skill is in the allowed list
 * 4. Parses and validates the files array from JSONB
 *
 * On error, returns helpful messages listing available skills.
 */
export async function getSkillWithAccess(
  skillKey: string,
  context: SkillAccessContext
): Promise<SkillAccessResult> {
  // Check if any skills are allowed
  if (context.allowedSkillIds.length === 0) {
    log.info('No skills allowed for this agent');
    return {
      success: false,
      error: 'No skills are available. This agent has no skills configured.',
    };
  }

  // Fetch skill by key
  const skill = await context.skillsFeature.getByKey({
    key: skillKey,
    userId: context.userId,
    orgId: context.orgId,
  });

  // Helper to get available skill keys for error messages
  const getAvailableSkillKeys = async (): Promise<string> => {
    const allSkills = await context.skillsFeature.getAll({
      userId: context.userId,
      orgId: context.orgId,
    });
    const allowedSkills = allSkills.filter((s) =>
      context.allowedSkillIds.includes(s.id)
    );
    return allowedSkills.map((s) => s.key).join(', ');
  };

  // Skill not found
  if (!skill) {
    const availableKeys = await getAvailableSkillKeys();
    log.warn('Skill not found', { skillKey, availableKeys });
    return {
      success: false,
      error: `Skill "${skillKey}" not found. Available skills: ${availableKeys}`,
    };
  }

  // Skill not in allowed list
  if (!context.allowedSkillIds.includes(skill.id)) {
    const availableKeys = await getAvailableSkillKeys();
    log.warn('Skill not allowed', { skillKey, availableKeys });
    return {
      success: false,
      error: `Skill "${skillKey}" is not available. Available skills: ${availableKeys}`,
    };
  }

  // Validate and parse files from JSONB
  const files = parseSkillFiles(skill.files);
  if (!files) {
    log.error('Skill has invalid file format', { skillKey, skillId: skill.id });
    return {
      success: false,
      error: 'Skill has invalid file format',
    };
  }

  return {
    success: true,
    skill,
    files,
  };
}
