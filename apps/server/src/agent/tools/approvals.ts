/**
 * Tool approval logic
 *
 * Determines which commands require human approval before execution.
 *
 * Approval is configured per-action via the `needsApproval` flag in each
 * action's metadata (see actions/{action}/index.ts files). Actions that modify
 * user-owned data typically require approval:
 * - Artifact operations (write, update, patch)
 * - Task operations (create, update, delete, move, reorder)
 * - Project operations (create, update, delete)
 * - Agent configuration (update, enable/disable, favorites)
 * - Skill management (create, update, delete)
 *
 * Read-only operations and agent-internal state don't require approval.
 */

import { getActionNeedsApproval } from '../actions';
import { parseCommand } from './execute-command';

/**
 * Check if a command requires approval based on the action's metadata.
 * Parses the command string and looks up the action's needsApproval flag.
 */
export function checkCommandRequiresApproval(command: string): boolean {
  try {
    const parsed = parseCommand(command);
    return getActionNeedsApproval(parsed.tool);
  } catch {
    // Parse error - will fail at execute time, no approval needed
    return false;
  }
}
