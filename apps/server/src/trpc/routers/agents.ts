import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const agentsRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.agentsFeature.agents.list();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.agentsFeature.agents.get(input.id);
    }),
});
