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
import { getSkillWithAccess, getLineCount } from './shared/skill-access';

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
 * Result of listing skill files (success case wrapped in data)
 */
export interface ListSkillFilesSuccessResult {
  success: true;
  data: {
    skillKey: string;
    skillName: string;
    files: SkillFileInfo[];
  };
}

/**
 * Result of listing skill files (error case)
 */
export interface ListSkillFilesErrorResult {
  success: false;
  error: string;
}

export type ListSkillFilesResult =
  | ListSkillFilesSuccessResult
  | ListSkillFilesErrorResult;

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
    }): Promise<ListSkillFilesResult> => {
      log.info('Listing skill files', { skillKey });

      try {
        // Use shared helper for skill access validation
        const result = await getSkillWithAccess(skillKey, context);

        if (!result.success) {
          return result;
        }

        const { skill, files } = result;

        // Get file list with line counts
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
          data: {
            skillKey: skill.key,
            skillName: skill.name,
            files: fileInfos,
          },
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
