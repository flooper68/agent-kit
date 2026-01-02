import { env } from './env';
import { createClerkClient, verifyToken } from '@clerk/backend';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
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
import pubsubTestRoutes from './routes/pubsub-test';
import { appRouter, createContext, type AppRouter } from './trpc';
import { OrgRole, type AuthContext } from './types/auth';
import { AgentSessionManager, AgentWorker } from './agent';
import { AgentsFeature } from './features/agents';

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(corsPlugin);

// Register Clerk authentication
fastify.register(clerkPlugin, { secretKey: env.CLERK_SECRET_KEY });

fastify.register(redisPlugin, { url: env.REDIS_URL });
fastify.register(fastifyWebsocket);
fastify.register(pubsubTestRoutes, { prefix: '/api' });

// Create agents feature (single instance)
const agentsFeature = new AgentsFeature(db);

// Will be initialized after Redis is ready
let sessionManager: AgentSessionManager;

// Hook to initialize Redis-dependent services after Redis plugin is registered
fastify.addHook('onReady', async () => {
  const redis = fastify.redis.publisher;
  const workerRedis = fastify.redis.worker;

  // Create session manager with Redis and AgentsFeature
  // Pass dedicated worker connection for blocking operations
  sessionManager = new AgentSessionManager(redis, agentsFeature, workerRedis);

  // Create the agent worker
  const agentWorker = new AgentWorker(sessionManager);

  fastify.log.info('Starting agent worker...');

  // Start the agent worker in the background
  agentWorker.start().catch((err) => {
    fastify.log.error(err, 'Agent worker error');
  });

  fastify.log.info('Agent worker initialization complete');
});

// Register tRPC - uses a getter to access sessionManager after it's initialized
fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: (opts) => {
      // Create context with all dependencies
      return createContext({
        clerk,
        agentsFeature,
        sessionManager,
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

    await fastify.listen({ port: env.PORT, host: env.HOST });
    console.log(`Server is running at http://${env.HOST}:${env.PORT}`);

    // Set up WebSocket server for tRPC subscriptions
    // We use a separate port for WebSocket to avoid conflicts with Fastify
    const wss = new WebSocketServer({
      port: env.PORT + 1,
      path: '/trpc',
    });

    const handler = applyWSSHandler<AppRouter>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wss: wss as any,
      router: appRouter,
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
          sessionManager,
        };
      },
    });

    console.log(
      `WebSocket server is running at ws://${env.HOST}:${env.PORT + 1}/trpc`
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
