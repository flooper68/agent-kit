import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentsFeature } from '../../features/agents';
import type { SkillsFeature } from '../../features/skills';
import type { SlashCommandsFeature } from '../../features/slash-commands';
import type { EventStreamManager } from '../../streams/event-stream-manager';
import type { PubSubManager } from '../../real-time';
import type { AgentScope } from '../permissions/scopes';

/**
 * Metadata for an action, including its required scopes.
 * Each action should export its metadata for permission checking.
 */
export interface ActionMetadata {
  /** Unique identifier for the action */
  id: string;
  /** Scopes required to execute this action (empty = action denied) */
  requiredScopes: AgentScope[];
  /** Whether this action requires user approval before execution */
  needsApproval?: boolean;
}

/**
 * Context required for actions (no tool-specific dependencies)
 */
export interface ActionsContext {
  // Core identifiers - always required
  userId: string;
  orgId: string;
  sessionId: string;
  messageId: string;

  // Core features - always required
  artifactsFeature: ArtifactsFeature;
  /** Agents feature for agent management actions */
  agentsFeature: AgentsFeature;
  /** Skills feature for skill actions */
  skillsFeature: SkillsFeature;
  /** Event stream manager for client-side actions */
  eventStreamManager: EventStreamManager;
  /** Pub/Sub manager for stateful client-side actions */
  pubsub: PubSubManager;

  // Feature-flagged - remain optional
  projectsFeature?: ProjectsFeature;
  tasksFeature?: TasksFeature;
  /** Slash commands feature for slash command management actions */
  slashCommandsFeature?: SlashCommandsFeature;

  /** Allowed skill IDs for this agent (empty array = no skills allowed) */
  allowedSkillIds: string[];

  /** Agent scopes for permission checks (empty array = no permissions) */
  agentScopes: string[];
}

/**
 * Context for client-side actions (subset of ActionsContext)
 */
export interface ClientActionContext {
  sessionId: string;
  messageId: string;
  eventStreamManager: EventStreamManager;
  pubsub?: PubSubManager;
}
