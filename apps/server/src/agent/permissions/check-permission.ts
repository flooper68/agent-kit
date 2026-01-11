import { AgentScope } from './scopes';
import { getActionRequiredScopes } from '../actions/actions';

export interface PermissionCheckResult {
  allowed: boolean;
  missingScopes: AgentScope[];
}

/**
 * Check if an agent has permission to execute an action.
 *
 * @param actionId - The action being executed
 * @param agentScopes - The scopes granted to the agent
 * @returns Result indicating if action is allowed and any missing scopes
 */
export function checkActionPermission(
  actionId: string,
  agentScopes: string[]
): PermissionCheckResult {
  const requiredScopes = getActionRequiredScopes(actionId);

  // Actions without scope requirements are denied (deny-by-default)
  if (requiredScopes.length === 0) {
    return { allowed: false, missingScopes: [] };
  }

  const scopeSet = new Set(agentScopes);
  const missingScopes = requiredScopes.filter((scope) => !scopeSet.has(scope));

  return {
    allowed: missingScopes.length === 0,
    missingScopes,
  };
}

/**
 * Create a permission error message for missing scopes.
 */
export function createPermissionError(
  actionId: string,
  missingScopes: AgentScope[]
): string {
  if (missingScopes.length === 0) {
    return `Permission denied: Action "${actionId}" has no permissions defined`;
  }
  const scopeNames = missingScopes.join(', ');
  return `Permission denied: Action "${actionId}" requires scope(s): ${scopeNames}`;
}
