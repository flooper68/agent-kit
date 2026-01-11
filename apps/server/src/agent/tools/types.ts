import type { ArtifactsFeature } from '../../features/artifacts';
import type { ProjectsFeature } from '../../features/projects';
import type { TasksFeature } from '../../features/tasks';
import type { AgentsFeature } from '../../features/agents';
import type { SkillsFeature } from '../../features/skills';
import type { EventStreamManager } from '../event-stream-manager';
import type { PubSubManager } from '../../real-time';
import type { AgentSpawner } from '../agent-spawner';
import type { ToolCategory } from '@agent-kit/shared';

/**
 * Context required for context-aware tools
 */
export interface ToolContext {
  // Core identifiers - always required
  userId: string;
  orgId: string;
  sessionId: string;
  messageId: string;

  // Agent context - optional, not all contexts have an agent
  agentId?: string;
  /** Key of the current agent (for spawn validation) */
  parentAgentKey?: string;

  // Core features - always required
  artifactsFeature: ArtifactsFeature;
  /** Agents feature for agent management tools */
  agentsFeature: AgentsFeature;
  /** Skills feature for skill tools */
  skillsFeature: SkillsFeature;
  /** Event stream manager for client-side tools */
  eventStreamManager: EventStreamManager;
  /** Pub/Sub manager for stateful client-side tools */
  pubsub: PubSubManager;
  /** Agent spawner for spawnAgent tool */
  agentSpawner: AgentSpawner;

  // Feature-flagged - remain optional
  projectsFeature?: ProjectsFeature;
  tasksFeature?: TasksFeature;

  // Spawn context - required (callers set defaults)
  /** Current spawn depth for recursion tracking (0 for root sessions) */
  currentSpawnDepth: number;
  /** Allowed skill IDs for this agent (empty array = no skills allowed) */
  allowedSkillIds: string[];
  /** Allowed tool IDs for this agent (used by executeCommand for access control) */
  allowedToolIds: string[];
}

/**
 * Tool metadata for UI display
 */
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
}
