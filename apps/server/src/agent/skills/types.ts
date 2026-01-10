/**
 * Skill system types
 *
 * Skills are documentation bundles that teach agents how to use related tools.
 * They mimic a file system structure for progressive disclosure.
 */

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
