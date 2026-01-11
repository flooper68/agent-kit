// Re-export scope enum and constants from shared package
export {
  AgentScope,
  ALL_SCOPES,
  DEFAULT_AGENT_SCOPES,
} from '@agent-kit/shared';

import { AgentScope } from '@agent-kit/shared';

/** Scope metadata for UI display */
export interface ScopeMetadata {
  label: string;
  description: string;
  category: string;
}

export const SCOPE_METADATA: Record<AgentScope, ScopeMetadata> = {
  // Artifacts
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
  [AgentScope.ARTIFACTS_DELETE]: {
    label: 'Delete Artifacts',
    description: 'Allow deleting documents permanently',
    category: 'Artifacts',
  },

  // Utilities (Static Actions)
  [AgentScope.UTILITIES_TIME]: {
    label: 'Get Time',
    description: 'Allow getting the current date and time',
    category: 'Utilities',
  },
  [AgentScope.UTILITIES_WEB_SEARCH]: {
    label: 'Web Search',
    description: 'Allow searching the web for information',
    category: 'Utilities',
  },
  [AgentScope.UTILITIES_FETCH]: {
    label: 'Fetch URLs',
    description: 'Allow fetching content from public URLs',
    category: 'Utilities',
  },
  [AgentScope.UTILITIES_EXTRACT]: {
    label: 'Extract Content',
    description: 'Allow extracting and parsing content from web pages',
    category: 'Utilities',
  },

  // Projects
  [AgentScope.PROJECTS_READ]: {
    label: 'Read Projects',
    description: 'Allow listing, searching, and viewing projects',
    category: 'Projects',
  },
  [AgentScope.PROJECTS_WRITE]: {
    label: 'Write Projects',
    description: 'Allow creating and updating projects',
    category: 'Projects',
  },
  [AgentScope.PROJECTS_DELETE]: {
    label: 'Delete Projects',
    description: 'Allow deleting projects permanently',
    category: 'Projects',
  },

  // Tasks
  [AgentScope.TASKS_READ]: {
    label: 'Read Tasks',
    description: 'Allow listing, searching, and viewing tasks',
    category: 'Tasks',
  },
  [AgentScope.TASKS_WRITE]: {
    label: 'Write Tasks',
    description: 'Allow creating, updating, moving, and managing tasks',
    category: 'Tasks',
  },
  [AgentScope.TASKS_DELETE]: {
    label: 'Delete Tasks',
    description: 'Allow deleting tasks permanently',
    category: 'Tasks',
  },

  // UI (Client Actions)
  [AgentScope.UI_NAVIGATE]: {
    label: 'Navigate UI',
    description: 'Allow navigating the user to different pages',
    category: 'UI',
  },
  [AgentScope.UI_STATE]: {
    label: 'Read UI State',
    description: 'Allow reading the current UI state and context',
    category: 'UI',
  },

  // Agents
  [AgentScope.AGENTS_READ]: {
    label: 'Read Agents',
    description: 'Allow listing and viewing agent configurations',
    category: 'Agents',
  },
  [AgentScope.AGENTS_MANAGE]: {
    label: 'Manage Agents',
    description: 'Allow updating agent settings and preferences',
    category: 'Agents',
  },

  // Skills
  [AgentScope.SKILLS_READ]: {
    label: 'Read Skills',
    description: 'Allow listing and viewing skills',
    category: 'Skills',
  },
  [AgentScope.SKILLS_WRITE]: {
    label: 'Write Skills',
    description: 'Allow creating and updating skills',
    category: 'Skills',
  },
  [AgentScope.SKILLS_DELETE]: {
    label: 'Delete Skills',
    description: 'Allow deleting skills permanently',
    category: 'Skills',
  },
};
