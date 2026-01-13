/**
 * Tool approval logic
 *
 * Determines which commands require human approval before execution.
 */

import { getActionNeedsApproval } from '../actions';
import { parseCommand } from './execute-command';

/**
 * Check if a command requires approval based on the action's metadata.
 * This is used by the needsApproval function.
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
