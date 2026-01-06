import type Redis from 'ioredis';
import type { PubSubMessage, SubscribeAsyncOptions } from './types';

type MessageHandler<T = unknown> = (
  message: PubSubMessage<T>
) => void | Promise<void>;

export class PubSubManager {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<MessageHandler>>;

  constructor(publisher: Redis, subscriber: Redis) {
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.handlers = new Map();

    this.setupSubscriberEvents();
  }

  private setupSubscriberEvents(): void {
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });
  }

  private handleMessage(channel: string, rawMessage: string): void {
    const channelHandlers = this.handlers.get(channel);
    if (!channelHandlers || channelHandlers.size === 0) {
      return;
    }

    try {
      const data = JSON.parse(rawMessage) as unknown;
      const message: PubSubMessage = {
        channel,
        data,
        publishedAt: new Date().toISOString(),
      };

      for (const handler of channelHandlers) {
        Promise.resolve(handler(message)).catch((err) => {
          console.error(`Error in handler for channel ${channel}:`, err);
        });
      }
    } catch (err) {
      console.error(`Failed to parse message on channel ${channel}:`, err);
    }
  }

  async subscribe<T = unknown>(
    channel: string,
    handler: MessageHandler<T>
  ): Promise<void> {
    const existingHandlers = this.handlers.get(channel);
    if (existingHandlers) {
      existingHandlers.add(handler as MessageHandler);
    } else {
      this.handlers.set(channel, new Set([handler as MessageHandler]));
      await this.subscriber.subscribe(channel);
    }
  }

  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    const channelHandlers = this.handlers.get(channel);
    if (!channelHandlers) {
      return;
    }

    if (handler) {
      channelHandlers.delete(handler);
      if (channelHandlers.size === 0) {
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    } else {
      this.handlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
    }
  }

  async publish<T = unknown>(channel: string, data: T): Promise<number> {
    const message = JSON.stringify(data);
    return this.publisher.publish(channel, message);
  }

  /**
   * Subscribe to a channel and return an AsyncGenerator that yields messages.
   * This encapsulates the queue bridging logic internally.
   *
   * @param channel - The Redis pub/sub channel to subscribe to
   * @param options - Optional configuration (maxQueueSize defaults to 100)
   * @returns AsyncGenerator that yields parsed message data
   */
  async *subscribeAsync<T>(
    channel: string,
    options: SubscribeAsyncOptions = {}
  ): AsyncGenerator<T, void, unknown> {
    const { maxQueueSize = 100 } = options;

    const queue: T[] = [];
    const waiters: Array<() => void> = [];
    let closed = false;

    const handler = (message: PubSubMessage) => {
      if (closed) return;

      if (queue.length >= maxQueueSize) {
        queue.shift();
      }

      queue.push(message.data as T);

      const waiter = waiters.shift();
      if (waiter) {
        waiter();
      }
    };

    await this.subscribe(channel, handler);

    try {
      while (!closed) {
        if (queue.length > 0) {
          const item = queue.shift();
          if (item !== undefined) {
            yield item;
          }
        } else {
          await new Promise<void>((resolve) => {
            waiters.push(resolve);
          });
        }
      }
    } finally {
      closed = true;
      for (const waiter of waiters) {
        waiter();
      }
      await this.unsubscribe(channel, handler);
    }
  }

  async close(): Promise<void> {
    const channels = Array.from(this.handlers.keys());
    if (channels.length > 0) {
      await this.subscriber.unsubscribe(...channels);
    }
    this.handlers.clear();

    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }
}
