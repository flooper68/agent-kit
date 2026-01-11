import type { createClerkClient } from '@clerk/backend';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AuthContext } from '../types/auth.js';
import type {
  JobQueueManager,
  EventStreamManager,
  JobRegistryManager,
  StreamingStateManager,
  ExternalAgentsConnectionManager,
  ExternalAgentWebSocketRegistry,
  AgentSpawner,
} from '../agent';
import type { AgentsFeature } from '../features/agents';
import type { AnalyticsFeature } from '../features/analytics';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { SkillsFeature } from '../features/skills';
import type { PubSubManager, CacheInvalidationService } from '../real-time';

export type ClerkClient = ReturnType<typeof createClerkClient>;

export interface ContextDeps {
  clerk: ClerkClient;
  agentsFeature: AgentsFeature;
  analyticsFeature: AnalyticsFeature;
  artifactsFeature: ArtifactsFeature;
  projectsFeature: ProjectsFeature;
  tasksFeature: TasksFeature;
  skillsFeature: SkillsFeature;
  jobQueueManager: JobQueueManager;
  eventStreamManager: EventStreamManager;
  jobRegistryManager: JobRegistryManager;
  streamingStateManager: StreamingStateManager;
  pubsub: PubSubManager;
  externalAgentsConnectionManager: ExternalAgentsConnectionManager;
  externalAgentWSRegistry: ExternalAgentWebSocketRegistry;
  cacheInvalidation: CacheInvalidationService;
  agentSpawner: AgentSpawner;
}

export function createContext(deps: ContextDeps) {
  return ({ req, res }: CreateFastifyContextOptions) => {
    // Type assertion needed because Fastify module augmentation is local to server package and the infer will not work in frontend package
    const auth = (req as unknown as { auth: AuthContext }).auth;

    return {
      req,
      res,
      auth: {
        userId: auth.userId,
        orgId: auth.orgId,
        orgRole: auth.orgRole,
      },
      clerk: deps.clerk,
      agentsFeature: deps.agentsFeature,
      analyticsFeature: deps.analyticsFeature,
      artifactsFeature: deps.artifactsFeature,
      projectsFeature: deps.projectsFeature,
      tasksFeature: deps.tasksFeature,
      skillsFeature: deps.skillsFeature,
      jobQueueManager: deps.jobQueueManager,
      eventStreamManager: deps.eventStreamManager,
      jobRegistryManager: deps.jobRegistryManager,
      streamingStateManager: deps.streamingStateManager,
      pubsub: deps.pubsub,
      externalAgentsConnectionManager: deps.externalAgentsConnectionManager,
      externalAgentWSRegistry: deps.externalAgentWSRegistry,
      cacheInvalidation: deps.cacheInvalidation,
      agentSpawner: deps.agentSpawner,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
