import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const greetingRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello, ${input.name}!`,
        timestamp: new Date().toISOString(),
      };
    }),
});
