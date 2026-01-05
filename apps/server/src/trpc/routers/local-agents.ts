import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const localAgentsRouter = router({
  // List user's local agents (does not include secret keys)
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.localAgentsFeature.list(ctx.auth.userId);
  }),

  // Get single local agent by ID
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.localAgentsFeature.getById(
        input.id,
        ctx.auth.userId
      );
      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Local agent not found',
        });
      }
      return agent;
    }),

  // Create new local agent (returns plaintext secret key ONCE)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.localAgentsFeature.create({
        userId: ctx.auth.userId,
        name: input.name,
        description: input.description,
        // Use sensible defaults for internal fields
        systemPrompt: 'You are a helpful AI assistant.',
        provider: 'openai',
        model: 'gpt-5-mini',
      });

      return {
        agent: {
          id: result.agent.id,
          name: result.agent.name,
          description: result.agent.description,
          systemPrompt: result.agent.systemPrompt,
          provider: result.agent.provider,
          model: result.agent.model,
          tools: result.agent.tools,
          disabled: result.agent.disabled,
          createdAt: result.agent.createdAt,
          updatedAt: result.agent.updatedAt,
        },
        secretKey: result.secretKey,
      };
    }),

  // Update local agent
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const agent = await ctx.localAgentsFeature.update(
        id,
        ctx.auth.userId,
        updates
      );

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Local agent not found',
        });
      }

      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        provider: agent.provider,
        model: agent.model,
        tools: agent.tools,
        disabled: agent.disabled,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      };
    }),

  // Enable or disable local agent
  setDisabled: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        disabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.localAgentsFeature.setDisabled(
        input.id,
        ctx.auth.userId,
        input.disabled
      );

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Local agent not found',
        });
      }

      return { success: true, disabled: agent.disabled };
    }),

  // Regenerate secret key (returns new plaintext key)
  regenerateKey: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const secretKey = await ctx.localAgentsFeature.regenerateKey(
        input.id,
        ctx.auth.userId
      );

      if (!secretKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Local agent not found',
        });
      }

      return { secretKey };
    }),
});
