import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentsFeature } from '../../features/agents';
import type { SkillsFeature } from '../../features/skills';
import type { EventStreamManager } from '../event-stream-manager';
import type { PubSubManager } from '../../real-time';

/**
 * Context required for actions (no tool-specific dependencies)
 */
export interface ActionsContext {
  // Core identifiers - always required
  userId: string;
  orgId: string;
  sessionId: string;
  messageId: string;

  // Agent context - optional, not all contexts have an agent
  agentId?: string;

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

  /** Allowed skill IDs for this agent (empty array = no skills allowed) */
  allowedSkillIds: string[];
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
