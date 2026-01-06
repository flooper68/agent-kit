import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type Redis from 'ioredis';
import { createPubSubClients, createRedisClient } from '../lib/redis/client';
import { PubSubManager, type RedisConfig } from '../real-time';

export type RedisConnectionFactory = () => Redis;

declare module 'fastify' {
  interface FastifyInstance {
    redis: {
      publisher: Redis;
      subscriber: Redis;
      worker: Redis;
      createSubscriptionConnection: RedisConnectionFactory;
      pubsub: PubSubManager;
    };
  }
}

export interface RedisPluginOptions {
  url: string;
}

const redisPlugin: FastifyPluginAsync<RedisPluginOptions> = async (
  fastify: FastifyInstance,
  options: RedisPluginOptions
) => {
  const config: RedisConfig = { url: options.url };

  const { publisher, subscriber } = createPubSubClients(config);
  // Create a dedicated connection for the worker's blocking XREADGROUP operations
  const worker = createRedisClient(config);
  const pubsub = new PubSubManager(publisher, subscriber);

  // Factory function to create new connections for subscriptions
  // Each subscription gets its own connection to avoid blocking contention
  const createSubscriptionConnection: RedisConnectionFactory = () => {
    return createRedisClient(config);
  };

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      publisher.once('ready', resolve);
      publisher.once('error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      subscriber.once('ready', resolve);
      subscriber.once('error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      worker.once('ready', resolve);
      worker.once('error', reject);
    }),
  ]);

  fastify.log.info('Redis clients connected (publisher, subscriber, worker)');

  fastify.decorate('redis', {
    publisher,
    subscriber,
    worker,
    createSubscriptionConnection,
    pubsub,
  });

  publisher.on('error', (err) => {
    fastify.log.error({ err }, 'Redis publisher error');
  });

  subscriber.on('error', (err) => {
    fastify.log.error({ err }, 'Redis subscriber error');
  });

  worker.on('error', (err) => {
    fastify.log.error({ err }, 'Redis worker error');
  });

  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Redis connections...');
    await pubsub.close();
    await worker.quit();
    fastify.log.info('Redis connections closed');
  });
};

export default fp(redisPlugin, {
  name: 'redis',
  fastify: '5.x',
});
