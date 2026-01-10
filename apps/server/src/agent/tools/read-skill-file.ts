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
import { SKILLS, getSkillByKey } from '../skills';
import type { SkillFileContent } from '../skills/types';
import { logger } from '../logger';

const log = logger.child({ module: 'read-skill-file-tool' });

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
 * Get all available file paths across all skills
 */
function getAllFilePaths(): string[] {
  const paths: string[] = [];
  for (const skill of SKILLS) {
    for (const file of skill.files) {
      paths.push(`${skill.key}/${file.path}`);
    }
  }
  return paths;
}

/**
 * Create the readSkillFile tool
 *
 * This tool reads skill file content with optional partial reading.
 * Skills are documentation - no tracking or access control.
 */
export function createReadSkillFileTool(): Tool {
  const allPaths = getAllFilePaths();

  return tool({
    description: `Read a skill file by path.

Like \`cat\` or \`head\` in bash. Supports partial reading with lines/offset.

Skills are documentation bundles that teach you how to use related tools.
Read a skill's SKILL.md to learn about its tools and workflows.

Example paths:
${allPaths
  .slice(0, 10)
  .map((p) => `- ${p}`)
  .join('\n')}
${allPaths.length > 10 ? `... and ${allPaths.length - 10} more` : ''}

Use grepSkills to search for relevant files first.`,

    inputSchema: z.object({
      path: z
        .string()
        .min(1)
        .describe(
          'File path in format "skillKey/filePath" (e.g., "web-research/SKILL.md")'
        ),
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

      // Find the skill
      const skill = getSkillByKey(skillKey);
      if (!skill) {
        const availableKeys = SKILLS.map((s) => s.key).join(', ');
        log.warn('Skill not found', { skillKey, availableKeys });
        return {
          success: false,
          error: `Skill "${skillKey}" not found. Available skills: ${availableKeys}`,
        };
      }

      // Find the file
      const file = skill.files.find((f) => f.path === relativePath);
      if (!file) {
        const availableFiles = skill.files.map((f) => f.path).join(', ');
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
    },
  });
}
