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
import { seedPREnvironment } from './db/seed-pr';
import { db } from './db';
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
  ExternalAgentsConnectionManager,
  ExternalAgentWebSocketRegistry,
  ExternalAgentWebSocketService,
  AgentSpawner,
} from './agent';
import { AgentsFeature } from './features/agents';
import { AnalyticsFeature } from './features/analytics';
import { ArtifactsFeature } from './features/artifacts';
import { ProjectsFeature } from './features/projects';
import { TasksFeature } from './features/tasks';
import { SkillsFeature } from './features/skills';
import { ActivityFeature } from './features/activity';
import { SlashCommandsFeature } from './features/slash-commands';
import { CacheInvalidationService, PubSubManager } from './real-time';
import { createRedisClient, createPubSubClients } from './lib/redis/client';

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

// Create Redis clients
const redisConfig = { url: env.REDIS_URL };
const { publisher: redisPublisher, subscriber: redisSubscriber } =
  createPubSubClients(redisConfig);
const redisWorker = createRedisClient(redisConfig);
const pubsub = new PubSubManager(redisPublisher, redisSubscriber);
const createSubscriptionConnection = () => createRedisClient(redisConfig);

const fastify = Fastify({
  logger: true,
  // Increase max param length to support tRPC batched requests with many procedures
  maxParamLength: 500,
});

// Register CORS
fastify.register(corsPlugin);

// Register Clerk authentication
fastify.register(clerkPlugin, { secretKey: env.CLERK_SECRET_KEY });

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

// Create WebSocket registry for external agents (tracks active connections)
const externalAgentWSRegistry = new ExternalAgentWebSocketRegistry();

// Create agents feature (single instance)
const agentsFeature = new AgentsFeature(db);

// Agent names map for analytics display (names are looked up from DB)
const agentNameMap = new Map<string, string>();

// Create analytics feature
const analyticsFeature = new AnalyticsFeature(db, agentNameMap, clerk);

// Create artifacts feature
const artifactsFeature = new ArtifactsFeature(db, agentNameMap);

// Create projects feature
const projectsFeature = new ProjectsFeature(db);

// Create tasks feature
const tasksFeature = new TasksFeature(db);

// Create skills feature
const skillsFeature = new SkillsFeature(db);

// Create activity feature
const activityFeature = new ActivityFeature(db, clerk);

// Create slash commands feature
const slashCommandsFeature = new SlashCommandsFeature(db);

// Will be initialized in onReady hook
let jobQueueManager!: JobQueueManager;
let eventStreamManager!: EventStreamManager;
let jobRegistryManager!: JobRegistryManager;
let streamingStateManager!: StreamingStateManager;
let externalAgentsConnectionManager!: ExternalAgentsConnectionManager;
let cacheInvalidation!: CacheInvalidationService;
let externalAgentWSService!: ExternalAgentWebSocketService;
let agentSpawner!: AgentSpawner;

// Hook to initialize services that depend on Redis
fastify.addHook('onReady', async () => {
  // Create external agents connection manager
  externalAgentsConnectionManager = new ExternalAgentsConnectionManager(
    redisPublisher,
    pubsub
  );

  // Clean up stale connections from previous server instance
  await externalAgentsConnectionManager.cleanupAllConnections();

  // Create cache invalidation service and attach to features
  cacheInvalidation = new CacheInvalidationService(pubsub);
  projectsFeature.setCacheInvalidation(cacheInvalidation);
  tasksFeature.setCacheInvalidation(cacheInvalidation);
  agentsFeature.setAgentCacheInvalidation(cacheInvalidation);
  artifactsFeature.setCacheInvalidation(cacheInvalidation);
  skillsFeature.setSkillsCacheInvalidation(cacheInvalidation);
  slashCommandsFeature.setCacheInvalidation(cacheInvalidation);

  // Create infrastructure managers (split from AgentSessionManager)
  jobQueueManager = new JobQueueManager(redisPublisher, redisWorker);
  eventStreamManager = new EventStreamManager(
    redisPublisher,
    createSubscriptionConnection
  );
  jobRegistryManager = new JobRegistryManager(redisPublisher);
  streamingStateManager = new StreamingStateManager(
    redisPublisher,
    cacheInvalidation
  );

  // Create session summarizer for title/description generation
  const sessionSummarizer = new SessionSummarizer();

  // Wire up late-initialized dependencies on AgentsFeature
  agentsFeature.setSummarizer(sessionSummarizer, cacheInvalidation);
  agentsFeature.setStreamingStateManager(streamingStateManager);
  agentsFeature.setInterruptDependencies({
    eventStreamManager,
    streamingStateManager,
    jobRegistryManager,
    jobQueueManager,
    externalAgentWSRegistry,
  });

  // Create external agent WebSocket service
  externalAgentWSService = new ExternalAgentWebSocketService(
    externalAgentWSRegistry,
    externalAgentsConnectionManager,
    eventStreamManager,
    streamingStateManager,
    agentsFeature,
    artifactsFeature,
    skillsFeature,
    pubsub,
    projectsFeature,
    tasksFeature,
    slashCommandsFeature
  );

  // Create the agent spawner for spawning sub-agents
  agentSpawner = new AgentSpawner(
    agentsFeature,
    jobQueueManager,
    eventStreamManager,
    streamingStateManager,
    externalAgentWSRegistry,
    cacheInvalidation,
    jobRegistryManager
  );

  // Wire up agent spawner to external agent WebSocket service for sub-agent delegation
  externalAgentWSService.setAgentSpawner(agentSpawner);

  // Create the agent worker with new architecture
  const agentWorker = new AgentWorker(
    jobQueueManager,
    eventStreamManager,
    jobRegistryManager,
    streamingStateManager,
    agentsFeature,
    artifactsFeature,
    skillsFeature,
    agentSpawner,
    pubsub,
    cacheInvalidation,
    projectsFeature,
    tasksFeature,
    slashCommandsFeature
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
        skillsFeature,
        activityFeature,
        slashCommandsFeature,
        jobQueueManager,
        eventStreamManager,
        jobRegistryManager,
        streamingStateManager,
        pubsub,
        externalAgentsConnectionManager,
        externalAgentWSRegistry,
        cacheInvalidation,
        agentSpawner,
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

    // Seed PR environments with demo data (no-op for non-PR environments)
    await seedPREnvironment();

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
          skillsFeature,
          activityFeature,
          slashCommandsFeature,
          jobQueueManager,
          eventStreamManager,
          jobRegistryManager,
          streamingStateManager,
          pubsub,
          externalAgentsConnectionManager,
          externalAgentWSRegistry,
          cacheInvalidation,
          agentSpawner,
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
        // External agent connection - delegate to service
        externalAgentWSService.handleUpgrade(request, socket, head);
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
      `External agents WebSocket endpoint: ws://${env.HOST}:${env.PORT}/agents`
    );

    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing servers');
      handler.broadcastReconnectNotification();
      wss.close();
      await fastify.close();
      // Close Redis connections
      await pubsub.close();
      await redisWorker.quit();
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
