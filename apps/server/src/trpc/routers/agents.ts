import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  protectedProcedure,
  protectedProcedureWithErrors,
} from '../trpc';
import { getToolsMetadata } from '../../agent/tools';
import {
  getProviders,
  type Provider,
} from '../../agent/providers/model-config';
import { AgentValidationError } from '../../agent/validation';
import { ALL_SCOPES, SCOPE_METADATA } from '../../agent/permissions';

// Schema for thinking configuration
const thinkingConfigSchema = z
  .object({
    enabled: z.boolean(),
    // Anthropic
    budgetTokens: z.number().min(1024).max(32768).optional(),
    // OpenAI
    reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
    // Gemini 3
    thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
    // Gemini 2.5
    thinkingBudget: z.number().min(-1).max(32768).optional(),
  })
  .nullable();

// Common validation for agent key
const agentKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Key can only contain letters, numbers, underscores, and hyphens'
  );

/**
 * Normalize agent key to ensure consistency.
 * Applies the same transformation as the UI: trim, lowercase, replace spaces with hyphens.
 */
function normalizeAgentKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '-');
}

// Common validation for tools
const toolsSchema = z.array(z.string()).optional();

// Schema for allowed subagents
const allowedSubagentsSchema = z
  .object({
    serverAgentIds: z.array(z.string().uuid()).optional(),
    externalAgentIds: z.array(z.string().uuid()).optional(),
  })
  .optional();

// Schema for allowed skills
const allowedSkillIdsSchema = z.array(z.string().uuid()).optional();

// Schema for agent scopes (permissions)
// Validates against actual scope values from AgentScope enum
const scopesSchema = z
  .array(z.enum(ALL_SCOPES as [string, ...string[]]))
  .optional();

export const agentsRouter = router({
  // ==========================================
  // Agent listing and querying
  // ==========================================

  /**
   * List all custom agents (created via Agent Builder)
   * Used for agent selector dropdown
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.agentsFeature.agentSelector.list(ctx.auth.userId);
  }),

  /**
   * Get a specific agent by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.agentsFeature.agentSelector.get(input.id, ctx.auth.userId);
    }),

  // ==========================================
  // Tools, providers, and models
  // ==========================================

  /**
   * List all available tools with metadata
   */
  listTools: protectedProcedure.query(() => {
    return getToolsMetadata();
  }),

  /**
   * List all available scopes (permissions) for agent configuration
   */
  listScopes: protectedProcedure.query(() => {
    return ALL_SCOPES.map((scope) => ({
      id: scope,
      ...SCOPE_METADATA[scope],
    }));
  }),

  /**
   * List all available skills for agent configuration
   * Returns both system skills and user's custom skills
   */
  listSkillsForAgent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization ID is required',
      });
    }
    const skills = await ctx.skillsFeature.getAll({
      userId: ctx.auth.userId,
      orgId: ctx.auth.orgId,
    });
    return skills.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description ?? '',
      isSystem: s.isSystem,
    }));
  }),

  /**
   * List all available providers
   */
  listProviders: protectedProcedure.query(() => {
    return getProviders();
  }),

  /**
   * List all available models, optionally filtered by provider
   */
  listModels: protectedProcedure
    .input(
      z
        .object({
          provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      return ctx.agentsFeature.models.list(input?.provider);
    }),

  // ==========================================
  // Custom agent CRUD operations
  // ==========================================

  /**
   * List all user's custom agents (returns key prefixes only, not full keys)
   */
  listCustom: protectedProcedureWithErrors.query(async ({ ctx }) => {
    return ctx.agentsFeature.customAgents.list(ctx.auth.userId);
  }),

  /**
   * List external agents (WebSocket connected)
   */
  listExternal: protectedProcedureWithErrors.query(async ({ ctx }) => {
    return ctx.agentsFeature.customAgents.listExternal(ctx.auth.userId);
  }),

  /**
   * List server agents (Agent Builder created)
   */
  listServer: protectedProcedureWithErrors.query(async ({ ctx }) => {
    return ctx.agentsFeature.customAgents.listServer(ctx.auth.userId);
  }),

  /**
   * Get single custom agent by ID
   */
  getCustom: protectedProcedureWithErrors
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.agentsFeature.customAgents.getById(
        input.id,
        ctx.auth.userId
      );
      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }
      return agent;
    }),

  /**
   * Create new external agent (returns plaintext secret key ONCE)
   * External agents connect via WebSocket - they don't need server configuration.
   */
  createExternal: protectedProcedureWithErrors
    .input(
      z.object({
        key: agentKeySchema,
        name: z.string().trim().min(1).max(255),
        description: z.string().optional(),
        isFavorite: z.boolean().optional(),
        // Sub-agent permissions
        allowedSubagents: allowedSubagentsSchema,
        // Skill permissions
        allowedSkillIds: allowedSkillIdsSchema,
        // Allowed tools - which server tools this external agent can use
        allowedTools: toolsSchema,
        // Agent scopes (permissions for actions)
        scopes: scopesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        });
      }
      const result = await ctx.agentsFeature.customAgents.createExternal({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        key: normalizeAgentKey(input.key),
        name: input.name,
        description: input.description,
        isFavorite: input.isFavorite,
        allowedSubagents: input.allowedSubagents,
        allowedSkillIds: input.allowedSkillIds,
        allowedTools: input.allowedTools,
        scopes: input.scopes,
      });

      return {
        agent: result.agent,
        secretKey: result.secretKey,
      };
    }),

  /**
   * Create new server agent (Agent Builder) - no secret key needed
   */
  createServer: protectedProcedureWithErrors
    .input(
      z.object({
        key: agentKeySchema,
        name: z.string().trim().min(1).max(255),
        description: z.string().optional(),
        // Agent configuration
        provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
        tools: toolsSchema,
        // Model settings
        temperature: z.number().min(0).max(2).optional(),
        maxOutputTokens: z.number().positive().optional(),
        maxContextTokens: z.number().positive().optional(),
        thinkingConfig: thinkingConfigSchema.optional(),
        // User preferences
        isFavorite: z.boolean().optional(),
        // Sub-agent permissions
        allowedSubagents: allowedSubagentsSchema,
        // Skill permissions
        allowedSkillIds: allowedSkillIdsSchema,
        // Agent scopes (permissions for actions)
        scopes: scopesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        });
      }
      try {
        const agent = await ctx.agentsFeature.customAgents.createServer({
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
          key: normalizeAgentKey(input.key),
          name: input.name,
          description: input.description,
          provider: input.provider as Provider | undefined,
          model: input.model,
          systemPrompt: input.systemPrompt,
          tools: input.tools,
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
          maxContextTokens: input.maxContextTokens,
          thinkingConfig: input.thinkingConfig,
          isFavorite: input.isFavorite,
          allowedSubagents: input.allowedSubagents,
          allowedSkillIds: input.allowedSkillIds,
          scopes: input.scopes,
        });

        return { agent };
      } catch (error) {
        if (error instanceof AgentValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
            cause: {
              type: 'VALIDATION_ERROR',
              fieldErrors: error.fieldErrors,
            },
          });
        }
        throw error;
      }
    }),

  /**
   * Update custom agent (server or external)
   */
  updateCustom: protectedProcedureWithErrors
    .input(
      z.object({
        id: z.string().uuid(),
        agentType: z.enum(['external', 'server']),
        // Common fields
        name: z.string().trim().min(1).max(255).optional(),
        description: z.string().optional(),
        isFavorite: z.boolean().optional(),
        allowedSubagents: allowedSubagentsSchema,
        // Skill permissions (common to both types)
        allowedSkillIds: allowedSkillIdsSchema,
        // Server agent only fields
        key: agentKeySchema.optional(),
        provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
        tools: toolsSchema,
        temperature: z.number().min(0).max(2).nullable().optional(),
        maxOutputTokens: z.number().positive().nullable().optional(),
        maxContextTokens: z.number().positive().nullable().optional(),
        thinkingConfig: thinkingConfigSchema.optional(),
        // External agent only fields
        allowedTools: toolsSchema,
        // Agent scopes (permissions for actions) - common to both types
        scopes: scopesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization ID is required',
        });
      }
      const { id, agentType, key, ...restUpdates } = input;

      if (agentType === 'external') {
        // External agents support name, description, isFavorite, allowedSubagents, allowedSkillIds, allowedTools, scopes
        const agent = await ctx.agentsFeature.customAgents.updateExternal({
          id,
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
          updates: {
            name: restUpdates.name,
            description: restUpdates.description,
            isFavorite: restUpdates.isFavorite,
            allowedSubagents: restUpdates.allowedSubagents,
            allowedSkillIds: restUpdates.allowedSkillIds,
            allowedTools: restUpdates.allowedTools,
            scopes: restUpdates.scopes,
          },
        });

        if (!agent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agent not found',
          });
        }

        return agent;
      }

      // Server agent update
      const updates = {
        ...restUpdates,
        ...(key !== undefined ? { key: normalizeAgentKey(key) } : {}),
      };

      try {
        const agent = await ctx.agentsFeature.customAgents.update({
          id,
          userId: ctx.auth.userId,
          orgId: ctx.auth.orgId,
          updates: updates as Parameters<
            typeof ctx.agentsFeature.customAgents.update
          >[0]['updates'],
        });

        if (!agent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agent not found',
          });
        }

        return agent;
      } catch (error) {
        if (error instanceof AgentValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
            cause: {
              type: 'VALIDATION_ERROR',
              fieldErrors: error.fieldErrors,
            },
          });
        }
        throw error;
      }
    }),

  /**
   * Enable or disable custom agent
   */
  setDisabled: protectedProcedureWithErrors
    .input(
      z.object({
        id: z.string().uuid(),
        disabled: z.boolean(),
        agentType: z.enum(['external', 'server']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.agentsFeature.customAgents.setDisabled(
        input.id,
        ctx.auth.userId,
        input.disabled,
        input.agentType
      );

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return { success: true, disabled: agent.disabled };
    }),

  /**
   * Regenerate secret key (returns new plaintext key)
   */
  regenerateKey: protectedProcedureWithErrors
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const secretKey = await ctx.agentsFeature.customAgents.regenerateKey(
        input.id,
        ctx.auth.userId
      );

      if (!secretKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return { secretKey };
    }),

  /**
   * Toggle favorite status
   */
  toggleFavorite: protectedProcedureWithErrors
    .input(
      z.object({
        id: z.string().uuid(),
        isFavorite: z.boolean(),
        agentType: z.enum(['external', 'server']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.agentsFeature.customAgents.toggleFavorite(
        input.id,
        ctx.auth.userId,
        input.isFavorite,
        input.agentType
      );

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return { success: true, isFavorite: agent.isFavorite };
    }),

  /**
   * Soft delete a custom agent
   * The agent is hidden from all lists but data is preserved for auditing
   */
  delete: protectedProcedureWithErrors
    .input(
      z.object({
        id: z.string().uuid(),
        agentType: z.enum(['external', 'server']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agent = await ctx.agentsFeature.customAgents.delete(
        input.id,
        ctx.auth.userId,
        input.agentType
      );

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return { success: true };
    }),

  // ==========================================
  // External agent connection status
  // ==========================================

  /**
   * Subscribe to connection status updates for user's external agents
   */
  externalConnectionStatus: protectedProcedureWithErrors.subscription(
    async function* ({ ctx }) {
      // Create agent lister adapter for connection manager
      const agentLister = {
        list: async (userId: string) => {
          const agents =
            await ctx.agentsFeature.customAgents.listExternal(userId);
          return agents.map((a) => ({ id: a.id, key: a.key }));
        },
      };

      yield* ctx.externalAgentsConnectionManager.subscribeToStatusUpdates(
        ctx.auth.userId,
        agentLister
      );
    }
  ),
});
