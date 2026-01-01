import { env } from './env';
import { createClerkClient } from '@clerk/backend';
import Fastify from 'fastify';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { runMigrations } from './db/migrate';
import redisPlugin from './plugins/redis';
import corsPlugin from './plugins/cors';
import clerkPlugin from './plugins/clerk';
import pubsubTestRoutes from './routes/pubsub-test';
import { appRouter, createContext, type AppRouter } from './trpc';

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
fastify.register(pubsubTestRoutes, { prefix: '/api' });

// Register tRPC
fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: createContext(clerk),
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
