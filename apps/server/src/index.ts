import Fastify from 'fastify';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { runMigrations } from './db/migrate';
import redisPlugin from './plugins/redis';
import corsPlugin from './plugins/cors';
import pubsubTestRoutes from './routes/pubsub-test';
import { appRouter, createContext, type AppRouter } from './trpc';

const fastify = Fastify({
  logger: true,
});

// Register CORS first (before other plugins)
const allowedOrigins = (
  process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173']
).map((origin) => {
  const trimmed = origin.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
});
fastify.register(corsPlugin, { allowedOrigins });

fastify.register(redisPlugin);
fastify.register(pubsubTestRoutes, { prefix: '/api' });

// Register tRPC
fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: createContext(),
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

fastify.get('/', async () => {
  return { message: 'Hello World!' };
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    // Run database migrations
    await runMigrations();

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`Server is running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
