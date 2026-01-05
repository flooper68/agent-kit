import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const agentsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Get built-in agents
    const builtInAgents = ctx.agentsFeature.agents.list().map((agent) => ({
      ...agent,
      isLocal: false as const,
    }));

    // If user is authenticated, also fetch their local agents
    if (ctx.auth.userId) {
      const localAgents = await ctx.localAgentsFeature.list(ctx.auth.userId);

      // Filter out disabled local agents and map to combined format
      const activeLocalAgents = localAgents
        .filter((agent) => !agent.disabled)
        .map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          provider: agent.provider,
          model: agent.model,
          tools: agent.tools,
          releasedAt: null,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          isLocal: true as const,
        }));

      return [...builtInAgents, ...activeLocalAgents];
    }

    return builtInAgents;
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.agentsFeature.agents.get(input.id);
    }),
});
