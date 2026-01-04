import type { createClerkClient } from '@clerk/backend';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AuthContext } from '../types/auth.js';
import type { AgentSessionManager } from '../agent/agent-session-manager';
import type { AgentsFeature } from '../features/agents';
import type { AnalyticsFeature } from '../features/analytics';
import type { ArtifactsFeature } from '../features/artifacts';
import type { ProjectsFeature } from '../features/projects';
import type { TasksFeature } from '../features/tasks';
import type { PubSubManager } from '../lib/redis/pubsub';

export type ClerkClient = ReturnType<typeof createClerkClient>;

export interface ContextDeps {
  clerk: ClerkClient;
  agentsFeature: AgentsFeature;
  analyticsFeature: AnalyticsFeature;
  artifactsFeature: ArtifactsFeature;
  projectsFeature: ProjectsFeature;
  tasksFeature: TasksFeature;
  sessionManager: AgentSessionManager;
  pubsub: PubSubManager;
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
      sessionManager: deps.sessionManager,
      pubsub: deps.pubsub,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
