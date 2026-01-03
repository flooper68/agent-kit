import type { Tool } from '../types';
import type { ArtifactsFeature } from '../../features/artifacts';
import { getTimeTool } from './get-time';
import { webSearchTool } from './web-search';
import { extractContentTool } from './extract-content';
import { createWriteArtifactTool } from './write-artifact';
import { createSearchArtifactsTool } from './search-artifacts';
import { createReadArtifactTool } from './read-artifact';

// Static tools (no context needed)
const STATIC_TOOLS: Record<string, Tool> = {
  getTime: getTimeTool,
  webSearch: webSearchTool,
  extractContent: extractContentTool,
};

// Context-aware tool IDs
const CONTEXT_TOOL_IDS = [
  'writeArtifact',
  'searchArtifacts',
  'readArtifact',
] as const;

export type StaticToolId = keyof typeof STATIC_TOOLS;
export type ContextToolId = (typeof CONTEXT_TOOL_IDS)[number];
export type ToolId = StaticToolId | ContextToolId;

/**
 * Context required for artifact-related tools
 */
export interface ToolContext {
  userId: string;
  orgId: string;
  sessionId?: string;
  agentId?: string;
  artifactsFeature: ArtifactsFeature;
}

/**
 * Get tools by their IDs, creating context-aware tools as needed
 */
export function getToolsById(
  ids: string[],
  context?: ToolContext
): Record<string, Tool> {
  const result: Record<string, Tool> = {};

  for (const id of ids) {
    // Check static tools first
    const staticTool = STATIC_TOOLS[id];
    if (staticTool) {
      result[id] = staticTool;
      continue;
    }

    // Create context-aware tools if context is provided
    if (context) {
      switch (id) {
        case 'writeArtifact':
          result[id] = createWriteArtifactTool(context);
          break;
        case 'searchArtifacts':
          result[id] = createSearchArtifactsTool(context);
          break;
        case 'readArtifact':
          result[id] = createReadArtifactTool(context);
          break;
      }
    }
  }

  return result;
}

/**
 * List all available tool IDs
 */
export function listToolIds(): string[] {
  return [...Object.keys(STATIC_TOOLS), ...CONTEXT_TOOL_IDS];
}
