import { forwardRef, useState, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Dialog } from '../../../Dialog';
import { Button } from '../../../Button';
import { Text } from '../../../Typography';
import { Tooltip } from '../../../Tooltip';
import type { ToolResultPart } from '../../../../types/chat';
import {
  getExecuteCommandDisplayInfo,
  getBaseToolName,
  formatToolName,
} from '../tool-display-utils';

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

type ToolState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'pending_approval';

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
        pending_approval: 'bg-warning/10 text-warning',
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
    case 'pending_approval':
      return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4M12 16h.01"
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

// Approval status badge overlay - shows shield with check/x for approved/denied
// Positioned as an overlay on the top-right of the badge
const ApprovalStatusBadge = ({
  status,
}: {
  status: 'pending' | 'approved' | 'denied' | undefined;
}) => {
  if (!status || status === 'pending') return null;

  if (status === 'approved') {
    // Shield with checkmark - green, positioned as overlay
    return (
      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-green-500 dark:bg-green-600 ring-2 ring-white dark:ring-gray-900">
        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  // Shield with X - red, positioned as overlay
  return (
    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 dark:bg-red-600 ring-2 ring-white dark:ring-gray-900">
      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </span>
  );
};

// Result display component for dialog
const ResultDisplay = ({
  result,
  isError,
}: {
  result: unknown;
  isError: boolean;
}) => {
  // Helper to try parsing JSON from a string
  const tryParseJson = (str: string): unknown => {
    const trimmed = str.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return str;
      }
    }
    return str;
  };

  // Helper to format result for display
  const formatResult = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  const preClassName = cn(
    'text-xs p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words',
    isError ? 'bg-destructive/10 text-destructive' : 'bg-muted'
  );

  // Handle text content array format (common for MCP/remote agent results)
  if (Array.isArray(result)) {
    const textParts = result
      .filter(
        (item): item is { type: string; text: string } =>
          typeof item === 'object' &&
          item !== null &&
          'type' in item &&
          item.type === 'text' &&
          'text' in item &&
          typeof item.text === 'string'
      )
      .map((item) => tryParseJson(item.text));

    if (textParts.length > 0) {
      // If single text part, display it directly
      const displayValue = textParts.length === 1 ? textParts[0] : textParts;
      return <pre className={preClassName}>{formatResult(displayValue)}</pre>;
    }
  }

  // Handle string results
  if (typeof result === 'string') {
    const parsed = tryParseJson(result);
    return <pre className={preClassName}>{formatResult(parsed)}</pre>;
  }

  // Handle object/array results
  return <pre className={preClassName}>{JSON.stringify(result, null, 2)}</pre>;
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
  /** Approval status for tools that required user approval */
  approvalStatus?: 'pending' | 'approved' | 'denied';
  /** Reason for denial if the tool was rejected */
  approvalDenialReason?: string;
  /** User ID of who approved/denied the tool */
  approvedByUserId?: string;
  /** Timestamp when the approval decision was made (ISO string) */
  approvedAt?: string;
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

  // Compare approval props
  if (prev.approvalStatus !== next.approvalStatus) return false;
  if (prev.approvalDenialReason !== next.approvalDenialReason) return false;
  if (prev.approvedByUserId !== next.approvedByUserId) return false;
  if (prev.approvedAt !== next.approvedAt) return false;

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
    (
      {
        toolName,
        state,
        args,
        toolCallId: _toolCallId,
        result,
        approvalStatus,
        approvalDenialReason,
        approvedByUserId,
        approvedAt,
      },
      ref
    ) => {
      const [dialogOpen, setDialogOpen] = useState(false);

      // Badge is interactive (clickable) when args are provided
      const hasDialogData = args !== undefined;

      // Derive effective error state from multiple sources:
      // 1. Tool state is explicitly 'error'
      // 2. Server set isError flag on the result
      // 3. Result content contains { success: false } (e.g., executeCommand permission errors)
      const hasContentError =
        typeof result?.result === 'object' &&
        result?.result !== null &&
        'success' in result.result &&
        (result.result as Record<string, unknown>).success === false;
      const isError = state === 'error' || result?.isError || hasContentError;
      const effectiveState: ToolState = isError ? 'error' : state;

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
          <StateIcon state={effectiveState} />
        </>
      );

      // Build tooltip content with approval status
      const tooltipLines = [tooltipContent];
      if (approvalStatus === 'approved') {
        let approvalLine = '✓ Approved';
        if (approvedAt) {
          approvalLine += ` at ${new Date(approvedAt).toLocaleTimeString()}`;
        }
        if (approvedByUserId) {
          approvalLine += ` by ${approvedByUserId}`;
        }
        tooltipLines.push(approvalLine);
      } else if (approvalStatus === 'denied') {
        let denialLine = '✗ Denied';
        if (approvedAt) {
          denialLine += ` at ${new Date(approvedAt).toLocaleTimeString()}`;
        }
        if (approvedByUserId) {
          denialLine += ` by ${approvedByUserId}`;
        }
        tooltipLines.push(denialLine);
        if (approvalDenialReason) {
          tooltipLines.push(`Reason: ${approvalDenialReason}`);
        }
      }
      const fullTooltipContent = tooltipLines.join('\n');

      const badgeElement = hasDialogData ? (
        <button
          ref={ref}
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cn(
            toolBadgeVariants({ state: effectiveState, interactive: true })
          )}
        >
          {content}
        </button>
      ) : (
        <span
          className={cn(
            toolBadgeVariants({ state: effectiveState, interactive: false })
          )}
        >
          {content}
        </span>
      );

      // Wrap badge with relative container for the approval overlay
      const badgeWithOverlay = (
        <span className="relative inline-flex">
          {badgeElement}
          <ApprovalStatusBadge status={approvalStatus} />
        </span>
      );

      const badge = (
        <Tooltip content={fullTooltipContent} side="bottom">
          {badgeWithOverlay}
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
                        toolBadgeVariants({
                          state: effectiveState,
                          interactive: false,
                        })
                      )}
                    >
                      <StateIcon state={effectiveState} />
                    </span>
                  </div>
                </Dialog.Title>
                <Dialog.Description>
                  <code className="text-xs">{toolName}</code>
                </Dialog.Description>
              </Dialog.Header>

              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Approval Status Section */}
                {approvalStatus && (
                  <div className="space-y-2">
                    <Text size="14" variant="strong">
                      Approval Status
                    </Text>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          approvalStatus === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : approvalStatus === 'denied'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        )}
                      >
                        {approvalStatus.charAt(0).toUpperCase() +
                          approvalStatus.slice(1)}
                      </span>
                    </div>
                    {approvedByUserId && (
                      <div className="mt-2">
                        <Text size="14" variant="muted">
                          {approvalStatus === 'approved'
                            ? 'Approved by:'
                            : 'Denied by:'}{' '}
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {approvedByUserId}
                          </code>
                        </Text>
                      </div>
                    )}
                    {approvedAt && (
                      <div className="mt-1">
                        <Text size="14" variant="muted">
                          Decision at:{' '}
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {new Date(approvedAt).toLocaleString()}
                          </code>
                        </Text>
                      </div>
                    )}
                    {approvalDenialReason && (
                      <div className="mt-2">
                        <Text size="14" variant="muted">
                          Denial Reason:
                        </Text>
                        <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md mt-1">
                          {approvalDenialReason}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

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
