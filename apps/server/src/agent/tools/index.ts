import type { Tool } from '../types';
import { getTimeTool } from './get-time';
import { webSearchTool } from './web-search';
import { extractContentTool } from './extract-content';

// Tool registry - maps tool IDs to their implementations
export const TOOLS: Record<string, Tool> = {
  getTime: getTimeTool,
  webSearch: webSearchTool,
  extractContent: extractContentTool,
};

export type ToolId = keyof typeof TOOLS;

/**
 * Get tools by their IDs
 */
export function getToolsById(ids: string[]): Record<string, Tool> {
  const result: Record<string, Tool> = {};
  for (const id of ids) {
    const t = TOOLS[id];
    if (t) {
      result[id] = t;
    }
  }
  return result;
}

/**
 * List all available tool IDs
 */
export function listToolIds(): string[] {
  return Object.keys(TOOLS);
}
