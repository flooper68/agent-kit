import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type Redis from 'ioredis';
import { createPubSubClients, createRedisClient } from '../lib/redis/client';
import { PubSubManager } from '../lib/redis/pubsub';
import type { RedisConfig } from '../lib/redis/types';

declare module 'fastify' {
  interface FastifyInstance {
    redis: {
      publisher: Redis;
      subscriber: Redis;
      worker: Redis;
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
