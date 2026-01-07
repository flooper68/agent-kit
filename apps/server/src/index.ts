import { env } from './env';
import { createClerkClient, verifyToken } from '@clerk/backend';
import Fastify from 'fastify';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { runMigrations } from './db/migrate';
import { db } from './db';
import redisPlugin from './plugins/redis';
import corsPlugin from './plugins/cors';
import clerkPlugin from './plugins/clerk';
import { appRouter, createContext, type AppRouter } from './trpc';
import { OrgRole, type AuthContext } from './types/auth';
import {
  AgentWorker,
  JobQueueManager,
  EventStreamManager,
  JobRegistryManager,
  StreamingStateManager,
  SessionSummarizer,
  LocalAgentsConnectionManager,
  LocalAgentWebSocketRegistry,
  LocalAgentWebSocketService,
  AgentSpawner,
} from './agent';
import { AgentsFeature } from './features/agents';
import { AnalyticsFeature } from './features/analytics';
import { ArtifactsFeature } from './features/artifacts';
import { ProjectsFeature } from './features/projects';
import { TasksFeature } from './features/tasks';
import { LocalAgentsFeature } from './features/local-agents';
import { CacheInvalidationService, type PubSubManager } from './real-time';

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

const fastify = Fastify({
  logger: true,
  // Increase max param length to support tRPC batched requests with many procedures
  maxParamLength: 500,
});

// Register CORS
fastify.register(corsPlugin);

// Register Clerk authentication
fastify.register(clerkPlugin, { secretKey: env.CLERK_SECRET_KEY });

fastify.register(redisPlugin, { url: env.REDIS_URL });

// Prevent Fastify from processing WebSocket upgrade requests to /trpc
// The ws library handles these via the 'upgrade' event on the HTTP server
fastify.addHook('onRequest', async (request, reply) => {
  const isWebSocketUpgrade =
    request.headers.upgrade?.toLowerCase() === 'websocket';
  const isTrpcPath = request.url.startsWith('/trpc');

  if (isWebSocketUpgrade && isTrpcPath) {
    // Don't let Fastify handle this - ws library will handle the upgrade
    // We need to hijack the response to prevent Fastify from sending anything
    reply.hijack();
    return;
  }
});

// Create local agents feature (needed by agents feature)
const localAgentsFeature = new LocalAgentsFeature(db);

// Create WebSocket registry for local agents (tracks active connections)
const localAgentWSRegistry = new LocalAgentWebSocketRegistry();

// Create agents feature (single instance)
const agentsFeature = new AgentsFeature(db, localAgentsFeature);

// Create agent names map for analytics display
const agentNameMap = new Map<string, string>();
for (const agent of agentsFeature.agents.list()) {
  agentNameMap.set(agent.id, agent.name);
}

// Create analytics feature
const analyticsFeature = new AnalyticsFeature(db, agentNameMap);

// Create artifacts feature
const artifactsFeature = new ArtifactsFeature(db, agentNameMap);

// Create projects feature
const projectsFeature = new ProjectsFeature(db);

// Create tasks feature
const tasksFeature = new TasksFeature(db);

// Will be initialized after Redis is ready (in onReady hook, before listen)
let jobQueueManager!: JobQueueManager;
let eventStreamManager!: EventStreamManager;
let jobRegistryManager!: JobRegistryManager;
let streamingStateManager!: StreamingStateManager;
let pubsub!: PubSubManager;
let localAgentsConnectionManager!: LocalAgentsConnectionManager;
let cacheInvalidation!: CacheInvalidationService;
let localAgentWSService!: LocalAgentWebSocketService;

// Hook to initialize Redis-dependent services after Redis plugin is registered
fastify.addHook('onReady', async () => {
  const redis = fastify.redis.publisher;
  const workerRedis = fastify.redis.worker;
  const createSubscriptionConnection =
    fastify.redis.createSubscriptionConnection;

  // Store pubsub reference for tRPC context
  pubsub = fastify.redis.pubsub;

  // Create local agents connection manager
  localAgentsConnectionManager = new LocalAgentsConnectionManager(
    redis,
    pubsub
  );

  // Clean up stale connections from previous server instance
  await localAgentsConnectionManager.cleanupAllConnections();

  // Create cache invalidation service and attach to features
  cacheInvalidation = new CacheInvalidationService(pubsub);
  projectsFeature.setCacheInvalidation(cacheInvalidation);
  tasksFeature.setCacheInvalidation(cacheInvalidation);

  // Create infrastructure managers (split from AgentSessionManager)
  jobQueueManager = new JobQueueManager(redis, workerRedis);
  eventStreamManager = new EventStreamManager(
    redis,
    createSubscriptionConnection
  );
  jobRegistryManager = new JobRegistryManager(redis);
  streamingStateManager = new StreamingStateManager(redis, cacheInvalidation);

  // Create session summarizer for title/description generation
  const sessionSummarizer = new SessionSummarizer();

  // Wire up late-initialized dependencies on AgentsFeature
  agentsFeature.setSummarizer(sessionSummarizer, cacheInvalidation);
  agentsFeature.setStreamingStateManager(streamingStateManager);

  // Create local agent WebSocket service
  localAgentWSService = new LocalAgentWebSocketService(
    localAgentWSRegistry,
    localAgentsConnectionManager,
    eventStreamManager,
    streamingStateManager,
    agentsFeature,
    localAgentsFeature,
    artifactsFeature,
    projectsFeature,
    tasksFeature,
    pubsub
  );

  // Create the agent spawner for spawning sub-agents
  const agentSpawner = new AgentSpawner(
    agentsFeature,
    localAgentsFeature,
    jobQueueManager,
    eventStreamManager,
    streamingStateManager,
    localAgentWSRegistry,
    cacheInvalidation,
    jobRegistryManager
  );

  // Wire up agent spawner to local agent WebSocket service for sub-agent delegation
  localAgentWSService.setAgentSpawner(agentSpawner);

  // Create the agent worker with new architecture
  const agentWorker = new AgentWorker(
    jobQueueManager,
    eventStreamManager,
    jobRegistryManager,
    streamingStateManager,
    agentsFeature,
    artifactsFeature,
    pubsub,
    cacheInvalidation,
    projectsFeature,
    tasksFeature,
    localAgentsFeature,
    agentSpawner
  );

  fastify.log.info('Starting agent worker...');

  // Start the agent worker in the background
  agentWorker.start().catch((err) => {
    fastify.log.error(err, 'Agent worker error');
  });

  fastify.log.info('Agent worker initialization complete');
});

// Register tRPC - uses getters to access managers after they're initialized
fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: (opts) => {
      // Create context with all dependencies
      return createContext({
        clerk,
        agentsFeature,
        analyticsFeature,
        artifactsFeature,
        projectsFeature,
        tasksFeature,
        localAgentsFeature,
        jobQueueManager,
        eventStreamManager,
        jobRegistryManager,
        streamingStateManager,
        pubsub,
        localAgentsConnectionManager,
        localAgentWSRegistry,
        cacheInvalidation,
      })(opts);
    },
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

fastify.get('/', async () => {
  return {
    name: 'Agent Kit API',
    version: '0.0.1',
    status: 'running',
  };
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    // Run database migrations
    await runMigrations();

    // Set up WebSocket server for tRPC subscriptions
    // Using noServer mode to manually handle upgrade and avoid conflicts with Fastify
    const wss = new WebSocketServer({ noServer: true });

    const handler = applyWSSHandler<AppRouter>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wss: wss as any,
      router: appRouter,
      // Keep connections alive with ping/pong to detect dead connections
      keepAlive: {
        enabled: true,
        pingMs: 5000, // Send ping every 5 seconds
        pongWaitMs: 5000, // Wait 5 seconds for pong response
      },
      createContext: async (opts) => {
        // Extract token from connection params
        const params = opts.info.connectionParams as
          | { token?: string }
          | undefined;
        const token = params?.token;

        let auth: AuthContext = {
          userId: null,
          orgId: null,
          orgRole: null,
        };

        if (token) {
          try {
            // Verify the session token with Clerk
            const payload = await verifyToken(token, {
              secretKey: env.CLERK_SECRET_KEY,
            });

            // Extract org info based on JWT version
            let orgId: string | null = null;
            let orgRole: string | null = null;

            if (payload.v === 2) {
              orgId = payload.o?.id ?? null;
              orgRole = payload.o?.rol ?? null;
            } else {
              orgId = payload.org_id ?? null;
              orgRole = payload.org_role ?? null;
            }

            auth = {
              userId: payload.sub,
              orgId,
              orgRole: OrgRole.safeParse(orgRole).data ?? null,
            };
          } catch (err) {
            console.error('WebSocket auth error:', err);
          }
        }

        return {
          req: null as unknown as Parameters<
            ReturnType<typeof createContext>
          >[0]['req'],
          res: null as unknown as Parameters<
            ReturnType<typeof createContext>
          >[0]['res'],
          auth,
          clerk,
          agentsFeature,
          analyticsFeature,
          artifactsFeature,
          projectsFeature,
          tasksFeature,
          localAgentsFeature,
          jobQueueManager,
          eventStreamManager,
          jobRegistryManager,
          streamingStateManager,
          pubsub,
          localAgentsConnectionManager,
          localAgentWSRegistry,
          cacheInvalidation,
        };
      },
    });

    // Start HTTP server
    await fastify.listen({ port: env.PORT, host: env.HOST });
    console.log(`Server is running at http://${env.HOST}:${env.PORT}`);

    // Manually handle WebSocket upgrades to avoid conflicts with Fastify
    // This intercepts upgrade requests before Fastify tries to handle them as 404s
    fastify.server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);

      if (url.pathname === '/agents') {
        // Local agent connection - delegate to service
        localAgentWSService.handleUpgrade(request, socket, head);
      } else if (url.pathname === '/trpc') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    console.log(
      `WebSocket server is running at ws://${env.HOST}:${env.PORT}/trpc`
    );
    console.log(
      `Local agents WebSocket endpoint: ws://${env.HOST}:${env.PORT}/agents`
    );

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing servers');
      handler.broadcastReconnectNotification();
      wss.close();
      fastify.close();
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
