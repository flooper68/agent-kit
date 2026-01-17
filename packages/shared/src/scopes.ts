/**
 * Agent permission scopes.
 * Agents start with NO scopes by default (opt-in model).
 *
 * Shared between server and web app for type safety.
 */
export enum AgentScope {
  // Artifacts
  ARTIFACTS_READ = 'artifacts:read',
  ARTIFACTS_WRITE = 'artifacts:write',
  ARTIFACTS_DELETE = 'artifacts:delete',

  // Utilities (Static Actions)
  UTILITIES_TIME = 'utilities:time',
  UTILITIES_WEB_SEARCH = 'utilities:webSearch',
  UTILITIES_FETCH = 'utilities:fetch',
  UTILITIES_EXTRACT = 'utilities:extract',

  // Projects
  PROJECTS_READ = 'projects:read',
  PROJECTS_WRITE = 'projects:write',
  PROJECTS_DELETE = 'projects:delete',

  // Tasks
  TASKS_READ = 'tasks:read',
  TASKS_WRITE = 'tasks:write',
  TASKS_DELETE = 'tasks:delete',

  // UI (Client Actions)
  UI_NAVIGATE = 'ui:navigate',
  UI_STATE = 'ui:state',

  // Agents
  AGENTS_READ = 'agents:read',
  AGENTS_MANAGE = 'agents:manage',

  // Skills
  SKILLS_READ = 'skills:read',
  SKILLS_WRITE = 'skills:write',
  SKILLS_DELETE = 'skills:delete',

  // Slash Commands
  SLASH_COMMANDS_READ = 'slashCommands:read',
  SLASH_COMMANDS_WRITE = 'slashCommands:write',
  SLASH_COMMANDS_DELETE = 'slashCommands:delete',
}

/** Array of all scopes for iteration and validation */
export const ALL_SCOPES = Object.values(AgentScope);

/**
 * Default scopes for new agents.
 * Includes safe defaults while excluding destructive operations.
 */
export const DEFAULT_AGENT_SCOPES: AgentScope[] = [
  // Utilities - basic functions
  AgentScope.UTILITIES_TIME,
  AgentScope.UTILITIES_WEB_SEARCH,
  AgentScope.UTILITIES_FETCH,
  AgentScope.UTILITIES_EXTRACT,
  // Artifacts - document access
  AgentScope.ARTIFACTS_READ,
  AgentScope.ARTIFACTS_WRITE,
  // Tasks - task management
  AgentScope.TASKS_READ,
  AgentScope.TASKS_WRITE,
  // Projects - read-only
  AgentScope.PROJECTS_READ,
  // UI - interaction
  AgentScope.UI_NAVIGATE,
  AgentScope.UI_STATE,
];
