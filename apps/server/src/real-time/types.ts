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

/**
 * Options for subscribeAsync method
 */
export interface SubscribeAsyncOptions {
  /**
   * Maximum number of messages to queue before dropping oldest ones.
   * Defaults to 100.
   */
  maxQueueSize?: number;
}
