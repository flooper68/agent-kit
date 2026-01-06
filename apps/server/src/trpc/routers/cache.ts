import { router, orgProcedure, protectedProcedure } from '../trpc';
import {
  getCacheInvalidationChannel,
  getUserCacheInvalidationChannel,
  CacheInvalidationEventSchema,
} from '../../real-time';

export const cacheRouter = router({
  subscribe: orgProcedure.subscription(async function* ({ ctx }) {
    const channel = getCacheInvalidationChannel(ctx.auth.orgId);

    for await (const message of ctx.pubsub.subscribeAsync<unknown>(channel)) {
      const parsed = CacheInvalidationEventSchema.safeParse(message);
      if (parsed.success) {
        yield parsed.data;
      }
    }
  }),

  subscribeUser: protectedProcedure.subscription(async function* ({ ctx }) {
    const channel = getUserCacheInvalidationChannel(ctx.auth.userId);

    for await (const message of ctx.pubsub.subscribeAsync<unknown>(channel)) {
      const parsed = CacheInvalidationEventSchema.safeParse(message);
      if (parsed.success) {
        yield parsed.data;
      }
    }
  }),
});
