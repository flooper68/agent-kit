import Redis from 'ioredis';
import type { RedisConfig } from './types';

const DEFAULT_CONFIG: Partial<RedisConfig> = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

export function createRedisClient(config: RedisConfig): Redis {
  const options = { ...DEFAULT_CONFIG, ...config };

  const client = new Redis(options.url, {
    maxRetriesPerRequest: options.maxRetriesPerRequest,
    enableReadyCheck: options.enableReadyCheck,
    lazyConnect: options.lazyConnect,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 30000);
      return delay;
    },
  });

  return client;
}

export function createPubSubClients(config: RedisConfig): {
  publisher: Redis;
  subscriber: Redis;
} {
  return {
    publisher: createRedisClient(config),
    subscriber: createRedisClient(config),
  };
}
