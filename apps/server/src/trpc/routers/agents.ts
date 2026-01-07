import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const agentsRouter = router({
  listBuiltIn: protectedProcedure.query(async ({ ctx }) => {
    return ctx.agentsFeature.agents.list().map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      provider: agent.provider,
      model: agent.model,
      tools: agent.tools,
      releasedAt: agent.releasedAt,
    }));
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Get built-in agents
    const builtInAgents = ctx.agentsFeature.agents.list().map((agent) => ({
      ...agent,
      isLocal: false as const,
    }));

    // Fetch user's local agents
    const localAgents = await ctx.localAgentsFeature.list(ctx.auth.userId);

    // Filter out disabled local agents and map to combined format
    const activeLocalAgents = localAgents
      .filter((agent) => !agent.disabled)
      .map((agent) => ({
        id: agent.key,
        name: agent.name,
        description: agent.description,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        isLocal: true as const,
      }));

    return [...builtInAgents, ...activeLocalAgents];
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try built-in agents first
      const builtIn = ctx.agentsFeature.agents.get(input.id);
      if (builtIn) {
        return { ...builtIn, isLocal: false as const };
      }

      // Try local agent (exclude disabled agents for consistency with list)
      const localAgent = await ctx.localAgentsFeature.getById(
        input.id,
        ctx.auth.userId
      );
      if (localAgent && !localAgent.disabled) {
        return {
          id: localAgent.id,
          name: localAgent.name,
          description: localAgent.description ?? undefined,
          isLocal: true as const,
        };
      }

      return undefined;
    }),
});
