// Scope definitions
export { AgentScope, ALL_SCOPES, SCOPE_METADATA } from './scopes';
export type { ScopeMetadata } from './scopes';

// Action metadata with scopes (from action definitions)
export { ACTION_METADATA, getActionRequiredScopes } from '../actions/actions';

// Permission checking
export {
  checkActionPermission,
  createPermissionError,
} from './check-permission';
export type { PermissionCheckResult } from './check-permission';
