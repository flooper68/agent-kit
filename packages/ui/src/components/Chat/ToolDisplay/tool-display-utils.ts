/**
 * Shared utilities for tool display formatting.
 *
 * These functions extract meaningful display information from tool calls
 * to show users what the agent is actually doing, rather than generic tool names.
 *
 * Used by:
 * - ToolBadge: Display tool invocations in chat
 * - ApprovalPanel: Display tool name in approval banner
 */

/**
 * Extract display info from executeCommand command string.
 *
 * Parses CLI-style command to show the inner tool name and first value argument.
 * Displayed as "{ToolName}: {summary}" (e.g., "Web Search: react tutorials")
 */
export function getExecuteCommandDisplayInfo(args: Record<string, unknown>): {
  toolName: string;
  summary: string;
} | null {
  const command = args.command;
  if (typeof command !== 'string' || !command.trim()) {
    return null;
  }

  // Tokenize respecting quotes: split on spaces but keep quoted strings together
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const toolName = parts[0];
  if (!toolName) {
    return null;
  }

  // Find first non-flag argument for summary (skip --arg patterns)
  let summary = '';
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part && !part.startsWith('-')) {
      // Remove surrounding quotes
      summary = part.replace(/^["']|["']$/g, '');
      break;
    }
  }

  return { toolName, summary };
}

/**
 * Extracts the base tool name from an MCP pattern.
 * MCP tools have the format: mcp__server__toolName
 * Returns the original name if not an MCP tool.
 */
export function getBaseToolName(toolName: string): string {
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__');
    return parts[parts.length - 1] ?? toolName;
  }
  return toolName;
}

/**
 * Formats a tool name to be human-readable.
 * Handles MCP pattern (mcp__server__toolName), camelCase, PascalCase, and snake_case.
 */
export function formatToolName(toolName: string): string {
  // Extract tool name from MCP pattern: mcp__server__toolName
  let name = getBaseToolName(toolName);

  // Handle snake_case: replace underscores with spaces
  name = name.replace(/_/g, ' ');

  // Handle camelCase and PascalCase: insert space before capital letters
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Capitalize first letter of each word
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
