import type { createClerkClient } from '@clerk/backend';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AuthContext } from '../types/auth.js';
import type { AgentSessionManager } from '../agent/agent-session-manager';
import type { AgentsFeature } from '../features/agents';
import type { AnalyticsFeature } from '../features/analytics';
import type { ArtifactsFeature } from '../features/artifacts';

export type ClerkClient = ReturnType<typeof createClerkClient>;

export interface ContextDeps {
  clerk: ClerkClient;
  agentsFeature: AgentsFeature;
  analyticsFeature: AnalyticsFeature;
  artifactsFeature: ArtifactsFeature;
  sessionManager: AgentSessionManager;
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
      sessionManager: deps.sessionManager,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
