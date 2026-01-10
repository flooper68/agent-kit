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
import { SKILLS } from '../skills';
import { logger } from '../logger';

const log = logger.child({ module: 'grep-skills-tool' });

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
function searchAllSkills(pattern: string, skillKey?: string): GrepMatch[] {
  const matches: GrepMatch[] = [];
  const patternLower = pattern.toLowerCase();

  const skillsToSearch = skillKey
    ? SKILLS.filter((s) => s.key === skillKey)
    : SKILLS;

  for (const skill of skillsToSearch) {
    for (const file of skill.files) {
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
export function createGrepSkillsTool(): Tool {
  const skillKeys = SKILLS.map((s) => s.key);

  return tool({
    description: `Search across skill files for content matching a pattern.

Like \`grep -r\`, searches all skill files and returns matching lines with context.

Use this to:
- Discover which skill has tools for a task
- Find documentation about specific features
- Locate examples or workflows

Available skills to search: ${skillKeys.join(', ')}`,

    inputSchema: z.object({
      pattern: z
        .string()
        .min(1)
        .describe('Search pattern (case-insensitive substring match)'),
      skillKey: z
        .string()
        .optional()
        .describe(
          `Optional: limit search to one skill. Available: ${skillKeys.join(', ')}`
        ),
    }),

    execute: async ({
      pattern,
      skillKey,
    }: {
      pattern: string;
      skillKey?: string;
    }): Promise<GrepSkillsResult | { success: false; error: string }> => {
      log.info('Searching skills', { pattern, skillKey });

      // Validate skillKey if provided
      if (skillKey && !skillKeys.includes(skillKey)) {
        log.warn('Invalid skill key', { skillKey, availableKeys: skillKeys });
        return {
          success: false,
          error: `Skill "${skillKey}" not found. Available: ${skillKeys.join(', ')}`,
        };
      }

      const matches = searchAllSkills(pattern, skillKey);

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
    },
  });
}
