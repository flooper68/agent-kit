/**
 * readSkillFile tool
 *
 * Read a specific skill file, with optional partial reading support.
 * Similar to `cat`, `head`, or `tail` in bash.
 *
 * Skills are documentation bundles - reading them helps the agent
 * learn how to use related tools.
 *
 * Examples:
 *   readSkillFile --path "web-research/SKILL.md"
 *   readSkillFile --path "project-management/references/task-states.md"
 *   readSkillFile --path "web-research/SKILL.md" --lines 20
 *   readSkillFile --path "web-research/SKILL.md" --offset 20 --lines 20
 */

import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';
import type { SkillsFeature } from '../../features/skills';
import type { SkillFileContent } from '../skills/types';
import { logger } from '../logger';
import { SERVER_TOOL_DEFINITIONS } from '@agent-kit/shared';

const log = logger.child({ module: 'read-skill-file-tool' });

/**
 * Context for read skill file tool
 */
export interface ReadSkillFileToolContext {
  userId: string;
  orgId: string;
  skillsFeature: SkillsFeature;
  /** Allowed skill IDs for this agent (empty = no skills) */
  allowedSkillIds: string[];
}

/**
 * Parse a file path into skill key and relative path
 * e.g., "web-research/SKILL.md" -> { skillKey: "web-research", relativePath: "SKILL.md" }
 */
function parsePath(
  path: string
): { skillKey: string; relativePath: string } | null {
  const firstSlash = path.indexOf('/');
  if (firstSlash === -1) {
    return null;
  }

  return {
    skillKey: path.slice(0, firstSlash),
    relativePath: path.slice(firstSlash + 1),
  };
}

/**
 * Get line count for a string
 */
function getLineCount(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Read partial content from a string
 */
function readLines(
  content: string,
  offset: number,
  lines?: number
): { content: string; startLine: number; endLine: number; hasMore: boolean } {
  const allLines = content.split('\n');
  const totalLines = allLines.length;

  const startLine = Math.min(offset, totalLines);
  const endLine =
    lines !== undefined ? Math.min(startLine + lines, totalLines) : totalLines;

  const selectedLines = allLines.slice(startLine, endLine);
  const hasMore = endLine < totalLines;

  return {
    content: selectedLines.join('\n'),
    startLine,
    endLine: endLine - 1, // Convert to 0-indexed last line
    hasMore,
  };
}

/**
 * Create the readSkillFile tool
 *
 * This tool reads skill file content with optional partial reading.
 * Skills are documentation - no tracking or access control.
 */
export function createReadSkillFileTool(
  context: ReadSkillFileToolContext
): Tool {
  return tool({
    // Use shared description from @agent-kit/shared (single source of truth)
    description: SERVER_TOOL_DEFINITIONS.readSkillFile.description,
    // Schema inlined to avoid TypeScript recursion issues with AI SDK type inference
    inputSchema: z.object({
      path: z
        .string()
        .min(1)
        .describe('File path in format "skillKey/filePath"'),
      lines: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Number of lines to read (default: all)'),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Starting line number, 0-indexed (default: 0)'),
    }),

    execute: async ({
      path,
      lines,
      offset = 0,
    }: {
      path: string;
      lines?: number;
      offset?: number;
    }): Promise<SkillFileContent | { success: false; error: string }> => {
      log.info('Reading skill file', { path, lines, offset });

      // Parse the path
      const parsed = parsePath(path);
      if (!parsed) {
        log.warn('Invalid path format', { path });
        return {
          success: false,
          error: `Invalid path format. Expected "skillKey/filePath" (e.g., "web-research/SKILL.md")`,
        };
      }

      const { skillKey, relativePath } = parsed;

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

        // Find the file
        const files = skill.files as Array<{ path: string; content: string }>;
        const file = files.find((f) => f.path === relativePath);
        if (!file) {
          const availableFiles = files.map((f) => f.path).join(', ');
          log.warn('File not found in skill', {
            skillKey,
            relativePath,
            availableFiles,
          });
          return {
            success: false,
            error: `File "${relativePath}" not found in skill "${skillKey}". Available files: ${availableFiles}`,
          };
        }

        // Read the file content
        const totalLines = getLineCount(file.content);
        const partial = readLines(file.content, offset, lines);

        log.info('File read completed', {
          path,
          totalLines,
          startLine: partial.startLine,
          endLine: partial.endLine,
          hasMore: partial.hasMore,
        });

        return {
          path,
          content: partial.content,
          totalLines,
          startLine: partial.startLine,
          endLine: partial.endLine,
          hasMore: partial.hasMore,
        };
      } catch (error) {
        log.error('Error reading skill file', { error });
        return {
          success: false,
          error: 'Failed to read skill file',
        };
      }
    },
  });
}
