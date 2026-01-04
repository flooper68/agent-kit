import { router, orgProcedure } from '../trpc';
import {
  getCacheInvalidationChannel,
  CacheInvalidationEventSchema,
  type CacheInvalidationEvent,
} from '../../lib/redis/cache-invalidation-types';
import type { PubSubMessage } from '../../lib/redis/types';

// Maximum number of events to queue before dropping old ones
const MAX_QUEUE_SIZE = 100;

export const cacheRouter = router({
  subscribe: orgProcedure.subscription(async function* ({ ctx }) {
    const channel = getCacheInvalidationChannel(ctx.auth.orgId);

    // Use an async queue pattern to bridge callback-based pubsub to async generator
    const queue: CacheInvalidationEvent[] = [];
    const waiters: Array<() => void> = [];
    let closed = false;

    const handler = (message: PubSubMessage) => {
      const parsed = CacheInvalidationEventSchema.safeParse(message.data);
      if (parsed.success) {
        // Prevent unbounded queue growth - drop oldest events if at capacity
        if (queue.length >= MAX_QUEUE_SIZE) {
          queue.shift();
        }
        queue.push(parsed.data);
        // Resolve any waiting consumers
        const waiter = waiters.shift();
        if (waiter) {
          waiter();
        }
      }
    };

    // Subscribe to the channel
    await ctx.pubsub.subscribe(channel, handler);

    try {
      while (!closed) {
        if (queue.length > 0) {
          const event = queue.shift();
          if (event) {
            yield event;
          }
        } else {
          // Wait for new messages
          await new Promise<void>((resolve) => {
            waiters.push(resolve);
          });
        }
      }
    } finally {
      closed = true;
      // Resolve any remaining waiters so they can exit
      for (const waiter of waiters) {
        waiter();
      }
      await ctx.pubsub.unsubscribe(channel, handler);
    }
  }),
});
