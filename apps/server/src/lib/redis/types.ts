/**
 * Redis client configuration
 */
export interface RedisConfig {
  url: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

/**
 * Pub/Sub message wrapper
 */
export interface PubSubMessage<T = unknown> {
  channel: string;
  data: T;
  publishedAt: string;
}
