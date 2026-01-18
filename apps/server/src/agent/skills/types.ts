/**
 * Skill system types
 *
 * Skills are documentation bundles that teach agents how to use related tools.
 * They mimic a file system structure for progressive disclosure.
 */

import path from 'node:path';
import { z } from 'zod';

/**
 * Allowed directory prefixes for skill files.
 * Files must be in root (''), 'assets/', or 'references/' directories.
 */
export const ALLOWED_SKILL_FILE_PREFIXES = ['', 'assets/', 'references/'];

/**
 * Validate a skill file path.
 * - Must not contain path traversal sequences (..)
 * - Must not be an absolute path (start with /)
 * - Must be in an allowed directory (root, assets/, or references/)
 */
export function isValidSkillFilePath(filePath: string): boolean {
  // Reject absolute paths immediately
  if (path.posix.isAbsolute(filePath) || filePath.startsWith('/')) {
    return false;
  }

  // Normalize the path to resolve . and .. segments
  const normalized = path.posix.normalize(filePath);

  // After normalization, reject if it tries to escape (starts with ..)
  if (normalized.startsWith('..') || normalized.startsWith('/')) {
    return false;
  }

  // Reject empty paths or paths that resolve to current directory
  if (normalized === '' || normalized === '.') {
    return false;
  }

  // Get the directory part (empty string for root files)
  const dir = normalized.includes('/')
    ? normalized.slice(0, normalized.lastIndexOf('/') + 1)
    : '';

  return ALLOWED_SKILL_FILE_PREFIXES.includes(dir);
}

/**
 * Zod schema for validating skill file path
 */
export const SkillFilePathSchema = z
  .string()
  .min(1)
  .max(255)
  .refine(isValidSkillFilePath, {
    message: 'Path must be in root, assets/, or references/ directory',
  });

/**
 * Zod schema for validating a single skill file
 */
export const SkillFileSchema = z.object({
  path: SkillFilePathSchema,
  content: z.string().min(1).max(500_000),
});

/**
 * Zod schema for validating an array of skill files
 */
export const SkillFilesSchema = z.array(SkillFileSchema);

/**
 * Input schema for skill files - accepts content or contentBase64
 * This allows agents to pass file content as base64 to avoid escaping issues
 */
export const SkillFileInputSchema = z
  .object({
    path: SkillFilePathSchema,
    content: z.string().min(1).max(500_000).optional(),
    contentBase64: z.string().optional(),
  })
  .refine((data) => data.content || data.contentBase64, {
    message: 'Either content or contentBase64 must be provided',
  })
  .refine((data) => !(data.content && data.contentBase64), {
    message: 'Cannot provide both content and contentBase64',
  });

/**
 * Normalize a skill file input by decoding base64 if present
 */
export function normalizeSkillFile(file: {
  path: string;
  content?: string;
  contentBase64?: string;
}): { path: string; content: string } {
  if (file.content) {
    return { path: file.path, content: file.content };
  }
  if (file.contentBase64) {
    const decoded = Buffer.from(file.contentBase64, 'base64').toString('utf-8');
    return { path: file.path, content: decoded };
  }
  throw new Error('Either content or contentBase64 must be provided');
}

/**
 * Normalize an array of skill file inputs
 */
export function normalizeSkillFiles(
  files: Array<{ path: string; content?: string; contentBase64?: string }>
): Array<{ path: string; content: string }> {
  return files.map(normalizeSkillFile);
}

/**
 * Parse and validate skill files from unknown data (e.g., from JSONB)
 * Returns null if validation fails
 */
export function parseSkillFiles(
  files: unknown
): { path: string; content: string }[] | null {
  const result = SkillFilesSchema.safeParse(files);
  return result.success ? result.data : null;
}

/**
 * A file within a skill (e.g., SKILL.md, references/tips.md)
 */
export interface SkillFile {
  /** Relative path within the skill directory (e.g., "SKILL.md", "references/tips.md") */
  path: string;
  /** Full content of the file */
  content: string;
}

/**
 * Complete skill definition including all files
 */
export interface SkillDefinition {
  /** Unique key for the skill (e.g., "web-research") */
  key: string;
  /** Display name (e.g., "Web Research") */
  name: string;
  /** Short description for discovery - used by LLM to decide when to read */
  description: string;
  /** All files in this skill's directory */
  files: SkillFile[];
}

/**
 * Lightweight skill metadata for discovery
 */
export interface SkillMetadata {
  key: string;
  name: string;
  description: string;
  /** List of available file paths */
  availableFiles: string[];
}

/**
 * File content with line metadata (for partial reading)
 */
export interface SkillFileContent {
  path: string;
  content: string;
  totalLines: number;
  startLine: number;
  endLine: number;
  hasMore: boolean;
}

/**
 * Result of executing a skill command
 */
export interface ExecuteSkillResult {
  success: boolean;
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

/**
 * Parsed command from CLI-style string
 */
export interface ParsedCommand {
  tool: string;
  args: Record<string, unknown>;
}
