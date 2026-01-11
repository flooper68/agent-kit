import { forwardRef, useState, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Dialog } from '../../../Dialog';
import { Button } from '../../../Button';
import { Text } from '../../../Typography';
import { Tooltip } from '../../../Tooltip';
import type { ToolResultPart } from '../../../../types/chat';

/**
 * =============================================================================
 * SKILL TOOL DISPLAY HELPERS
 * =============================================================================
 *
 * These functions extract meaningful display information from skill-related tools
 * to show users what the agent is actually doing, rather than generic tool names.
 *
 * | Tool           | Generic Display      | Enhanced Display                    |
 * |----------------|----------------------|-------------------------------------|
 * | readSkillFile  | "Read Skill File"    | "Learn: web-research/SKILL.md"      |
 * | listSkillFiles | "List Skill Files"   | "Files: web-research"               |
 * | executeCommand | "Execute Command"    | "Web Search: react tutorials"       |
 *
 * All tools support both direct names and MCP-prefixed names
 * (e.g., "executeCommand" and "mcp__agent-kit-server__executeCommand").
 *
 * Full details remain available in the dialog when clicking the badge.
 * See docs/skills.md for more information about the skills system.
 */

/**
 * Extract the file path from readSkillFile args.
 *
 * Displayed as "Learn: {path}" to indicate the agent is learning
 * from skill documentation (e.g., "Learn: web-research/SKILL.md")
 */
function getReadSkillFileDisplayInfo(
  args: Record<string, unknown>
): string | null {
  const path = args.path;
  if (typeof path !== 'string' || !path.trim()) {
    return null;
  }
  return path;
}

/**
 * Extract the skill key from listSkillFiles args.
 *
 * Displayed as "Files: {skillKey}" to show which skill's files
 * are being listed.
 */
function getListSkillFilesDisplayInfo(
  args: Record<string, unknown>
): string | null {
  const skillKey = args.skillKey;
  if (typeof skillKey !== 'string' || !skillKey.trim()) {
    return null;
  }
  return skillKey;
}

/**
 * Extract display info from executeCommand command string.
 *
 * Parses CLI-style command to show the inner tool name and first value argument.
 * Displayed as "{ToolName}: {summary}" (e.g., "Web Search: react tutorials")
 */
function getExecuteCommandDisplayInfo(args: Record<string, unknown>): {
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
function getBaseToolName(toolName: string): string {
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
function formatToolName(toolName: string): string {
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

type ToolState = 'pending' | 'running' | 'completed' | 'error';

const toolBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
    'transition-colors',
  ],
  {
    variants: {
      state: {
        pending: 'bg-muted text-muted-foreground',
        running: 'bg-info/10 text-info',
        completed: 'bg-success/10 text-success',
        error: 'bg-destructive/10 text-destructive',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      state: 'pending',
      interactive: false,
    },
  }
);

// State icons as inline SVGs
const StateIcon = ({ state }: { state: ToolState }) => {
  switch (state) {
    case 'pending':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      );
    case 'running':
      return (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case 'completed':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'error':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
  }
};

// Tool icon
const ToolIcon = () => (
  <svg
    className="h-3 w-3 opacity-70"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Result display component for dialog
const ResultDisplay = ({
  result,
  isError,
}: {
  result: unknown;
  isError: boolean;
}) => {
  // Handle string results
  if (typeof result === 'string') {
    return (
      <pre
        className={cn(
          'text-xs p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words',
          isError ? 'bg-destructive/10 text-destructive' : 'bg-muted'
        )}
      >
        {result}
      </pre>
    );
  }

  // Handle object/array results
  const formatted = JSON.stringify(result, null, 2);
  return (
    <pre
      className={cn(
        'text-xs p-3 rounded-md overflow-x-auto',
        isError ? 'bg-destructive/10 text-destructive' : 'bg-muted'
      )}
    >
      {formatted}
    </pre>
  );
};

export interface ToolBadgeProps
  extends Omit<VariantProps<typeof toolBadgeVariants>, 'interactive'> {
  toolName: string;
  state: ToolState;
  /** Tool arguments - when provided, clicking the badge opens a detail dialog */
  args?: Record<string, unknown>;
  /** Tool call ID for tracking */
  toolCallId?: string;
  /** Tool result - displayed in the detail dialog */
  result?: ToolResultPart;
}

/**
 * Custom comparison function for ToolBadge memoization
 * Compares primitive props and checks result state changes
 */
function areToolBadgePropsEqual(
  prev: ToolBadgeProps,
  next: ToolBadgeProps
): boolean {
  // Compare primitive props
  if (prev.toolName !== next.toolName) return false;
  if (prev.state !== next.state) return false;
  if (prev.toolCallId !== next.toolCallId) return false;

  // Compare result - check if result exists and error state
  const prevHasResult = prev.result !== undefined;
  const nextHasResult = next.result !== undefined;
  if (prevHasResult !== nextHasResult) return false;
  if (prevHasResult && nextHasResult) {
    if (prev.result?.isError !== next.result?.isError) return false;
    if (prev.result?.toolCallId !== next.result?.toolCallId) return false;
  }

  return true;
}

export const ToolBadge = memo(
  forwardRef<HTMLButtonElement, ToolBadgeProps>(
    ({ toolName, state, args, toolCallId: _toolCallId, result }, ref) => {
      const [dialogOpen, setDialogOpen] = useState(false);

      // Badge is interactive (clickable) when args are provided
      const hasDialogData = args !== undefined;
      const isError = state === 'error' || result?.isError;

      // Default display name and tooltip
      let displayName = formatToolName(toolName);
      let tooltipContent = toolName;
      let useWideDisplay = false;

      // Extract base tool name for skill detection
      // MCP tools have prefix like "mcp__agent-kit-server__readSkillFile"
      const baseToolName = getBaseToolName(toolName);

      // Enhanced display for skill-related tools
      // Shows the actual operation instead of generic tool names
      // Works for both direct tool names and MCP-prefixed names
      // See: docs/skills.md#ui-display
      if (args) {
        if (baseToolName === 'readSkillFile') {
          // Show "Learn: path" to indicate learning from docs
          const path = getReadSkillFileDisplayInfo(args);
          if (path) {
            useWideDisplay = true;
            displayName = `Learn: ${path}`;
            tooltipContent = `readSkillFile: ${path}`;
          }
        } else if (baseToolName === 'listSkillFiles') {
          // Show "Files: skillKey" for skill file listing
          const skillKey = getListSkillFilesDisplayInfo(args);
          if (skillKey) {
            useWideDisplay = true;
            displayName = `Files: ${skillKey}`;
            tooltipContent = `listSkillFiles: ${skillKey}`;
          }
        } else if (baseToolName === 'executeCommand') {
          // Show inner tool name and first argument (e.g., "Web Search: react")
          const cmdInfo = getExecuteCommandDisplayInfo(args);
          if (cmdInfo) {
            useWideDisplay = true;
            displayName = formatToolName(cmdInfo.toolName);
            if (cmdInfo.summary) {
              displayName = `${displayName}: ${cmdInfo.summary}`;
            }
            tooltipContent = `executeCommand: ${cmdInfo.toolName}`;
          }
        }
      }

      const content = (
        <>
          <ToolIcon />
          <span
            className={cn(
              'truncate',
              useWideDisplay ? 'max-w-[200px]' : 'max-w-[120px]'
            )}
          >
            {displayName}
          </span>
          <StateIcon state={state} />
        </>
      );

      const badgeElement = hasDialogData ? (
        <button
          ref={ref}
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cn(toolBadgeVariants({ state, interactive: true }))}
        >
          {content}
        </button>
      ) : (
        <span className={cn(toolBadgeVariants({ state, interactive: false }))}>
          {content}
        </span>
      );

      const badge = (
        <Tooltip content={tooltipContent} side="bottom">
          {badgeElement}
        </Tooltip>
      );

      // If no dialog data, just render the badge
      if (!hasDialogData) {
        return badge;
      }

      // Render badge with dialog
      return (
        <>
          {badge}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Content size="lg">
              <Dialog.Header>
                <Dialog.Title>
                  <div className="flex items-center gap-3">
                    <span>{displayName}</span>
                    <span
                      className={cn(
                        toolBadgeVariants({ state, interactive: false })
                      )}
                    >
                      <StateIcon state={state} />
                    </span>
                  </div>
                </Dialog.Title>
                <Dialog.Description>
                  <code className="text-xs">{toolName}</code>
                </Dialog.Description>
              </Dialog.Header>

              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Input Section */}
                <div className="space-y-2">
                  <Text size="14" variant="strong">
                    Input
                  </Text>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(args, null, 2)}
                  </pre>
                </div>

                {/* Output Section */}
                {result && (
                  <div className="space-y-2">
                    <Text
                      size="14"
                      variant="strong"
                      className={isError ? 'text-destructive' : undefined}
                    >
                      {isError ? 'Error' : 'Output'}
                    </Text>
                    <ResultDisplay
                      result={result.result}
                      isError={isError ?? false}
                    />
                  </div>
                )}

                {/* No result yet */}
                {!result && state !== 'completed' && (
                  <Text size="14" variant="muted" className="italic">
                    {state === 'running'
                      ? 'Tool is currently executing...'
                      : 'Waiting for execution...'}
                  </Text>
                )}
              </div>

              <Dialog.Footer>
                <Dialog.Close asChild>
                  <Button variant="outline">Close</Button>
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </>
      );
    }
  ),
  areToolBadgePropsEqual
);

ToolBadge.displayName = 'ToolBadge';
