import type { createClerkClient } from '@clerk/backend';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AuthContext } from '../types/auth.js';
import type {
  JobQueueManager,
  EventStreamManager,
  JobRegistryManager,
  StreamingStateManager,
  LocalAgentsConnectionManager,
  LocalAgentWebSocketRegistry,
  AgentSpawner,
} from '../agent';
import type { AgentsFeature } from '../features/agents';
import type { AnalyticsFeature } from '../features/analytics';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { LocalAgentsFeature } from '../features/local-agents';
import type { PubSubManager, CacheInvalidationService } from '../real-time';

export type ClerkClient = ReturnType<typeof createClerkClient>;

export interface ContextDeps {
  clerk: ClerkClient;
  agentsFeature: AgentsFeature;
  analyticsFeature: AnalyticsFeature;
  artifactsFeature: ArtifactsFeature;
  projectsFeature: ProjectsFeature;
  tasksFeature: TasksFeature;
  localAgentsFeature: LocalAgentsFeature;
  jobQueueManager: JobQueueManager;
  eventStreamManager: EventStreamManager;
  jobRegistryManager: JobRegistryManager;
  streamingStateManager: StreamingStateManager;
  pubsub: PubSubManager;
  localAgentsConnectionManager: LocalAgentsConnectionManager;
  localAgentWSRegistry: LocalAgentWebSocketRegistry;
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
      localAgentsFeature: deps.localAgentsFeature,
      jobQueueManager: deps.jobQueueManager,
      eventStreamManager: deps.eventStreamManager,
      jobRegistryManager: deps.jobRegistryManager,
      streamingStateManager: deps.streamingStateManager,
      pubsub: deps.pubsub,
      localAgentsConnectionManager: deps.localAgentsConnectionManager,
      localAgentWSRegistry: deps.localAgentWSRegistry,
      cacheInvalidation: deps.cacheInvalidation,
      agentSpawner: deps.agentSpawner,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
