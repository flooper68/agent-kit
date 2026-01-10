/**
 * grepSkills tool
 *
 * Search across skill files like `grep -r`. Allows agents to discover
 * skills and find relevant content without knowing skill keys upfront.
 *
 * Examples:
 *   grepSkills --pattern "web search"
 *   grepSkills --pattern "create task" --skillKey "project-management"
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';
import type { Skill } from '../../db/schema';
import { logger } from '../logger';

const log = logger.child({ module: 'grep-skills-tool' });

/**
 * Context for grep skills tool
 */
export interface GrepSkillsToolContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
}

/**
 * A single search match
 */
export interface GrepMatch {
  skillKey: string;
  filePath: string;
  lineNumber: number;
  line: string;
}

/**
 * Result of grep operation
 */
export interface GrepSkillsResult {
  success: true;
  pattern: string;
  matchCount: number;
  matches: GrepMatch[];
}

/**
 * Search within all skill files for a pattern
 */
function searchAllSkills(
  skills: Skill[],
  pattern: string,
  skillKey?: string
): GrepMatch[] {
  const matches: GrepMatch[] = [];
  const patternLower = pattern.toLowerCase();

  const skillsToSearch = skillKey
    ? skills.filter((s) => s.key === skillKey)
    : skills;

  for (const skill of skillsToSearch) {
    const files = skill.files as Array<{ path: string; content: string }>;
    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.toLowerCase().includes(patternLower)) {
          matches.push({
            skillKey: skill.key,
            filePath: `${skill.key}/${file.path}`,
            lineNumber: i + 1, // 1-indexed like grep
            line: line.trim(),
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Create the grepSkills tool
 *
 * This tool enables skill discovery by searching across all skill files.
 * Similar to `grep -r` in bash.
 */
export function createGrepSkillsTool(context: GrepSkillsToolContext): Tool {
  return tool({
    description: `Search across skill files for content matching a pattern.

Like \`grep -r\`, searches all skill files and returns matching lines with context.

Use this to:
- Discover which skill has tools for a task
- Find documentation about specific features
- Locate examples or workflows

Skills include both system skills (shared) and your custom skills.`,

    inputSchema: z.object({
      pattern: z
        .string()
        .min(1)
        .describe('Search pattern (case-insensitive substring match)'),
      skillKey: z
        .string()
        .optional()
        .describe('Optional: limit search to one skill by its key'),
    }),

    execute: async ({
      pattern,
      skillKey,
    }: {
      pattern: string;
      skillKey?: string;
    }): Promise<GrepSkillsResult | { success: false; error: string }> => {
      log.info('Searching skills', { pattern, skillKey });

      try {
        // Get all skills accessible to this user (system + user's own)
        const skills = await context.skillsFeature.getAll({
          userId: context.userId,
          orgId: context.orgId,
        });

        const skillKeys = skills.map((s) => s.key);

        // Validate skillKey if provided
        if (skillKey && !skillKeys.includes(skillKey)) {
          log.warn('Invalid skill key', { skillKey, availableKeys: skillKeys });
          return {
            success: false,
            error: `Skill "${skillKey}" not found. Available: ${skillKeys.join(', ')}`,
          };
        }

        const matches = searchAllSkills(skills, pattern, skillKey);

        log.info('Search completed', {
          pattern,
          skillKey,
          matchCount: matches.length,
        });

        // Limit results to prevent massive outputs
        const maxMatches = 50;
        const truncatedMatches = matches.slice(0, maxMatches);

        return {
          success: true,
          pattern,
          matchCount: matches.length,
          matches: truncatedMatches,
          ...(matches.length > maxMatches && {
            note: `Showing first ${maxMatches} of ${matches.length} matches. Use skillKey parameter to narrow search.`,
          }),
        };
      } catch (error) {
        log.error('Error searching skills', { error });
        return {
          success: false,
          error: 'Failed to search skills',
        };
      }
    },
  });
}
