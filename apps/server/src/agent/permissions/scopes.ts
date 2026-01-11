/**
 * Agent permission scopes.
 * Agents start with NO scopes by default (opt-in model).
 */
export enum AgentScope {
  ARTIFACTS_READ = 'artifacts:read',
  ARTIFACTS_WRITE = 'artifacts:write',
}

/** Array of all scopes for iteration */
export const ALL_SCOPES = Object.values(AgentScope);

/** Scope metadata for UI display */
export interface ScopeMetadata {
  label: string;
  description: string;
  category: string;
}

export const SCOPE_METADATA: Record<AgentScope, ScopeMetadata> = {
  [AgentScope.ARTIFACTS_READ]: {
    label: 'Read Artifacts',
    description: 'Allow reading and searching saved documents',
    category: 'Artifacts',
  },
  [AgentScope.ARTIFACTS_WRITE]: {
    label: 'Write Artifacts',
    description: 'Allow creating and updating documents',
    category: 'Artifacts',
  },
};
