import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, orgProcedure } from '../trpc';
import {
  SkillFilePathSchema,
  normalizeSkillFiles,
} from '../../agent/skills/types';

/**
 * Schema for skill file input - accepts content or contentBase64
 */
const SkillFileSchema = z
  .object({
    path: SkillFilePathSchema,
    content: z.string().min(1).max(500_000).optional(), // 500KB per file
    contentBase64: z.string().optional(),
  })
  .refine((data) => data.content || data.contentBase64, {
    message: 'Either content or contentBase64 must be provided',
  })
  .refine((data) => !(data.content && data.contentBase64), {
    message: 'Cannot provide both content and contentBase64',
  });

const SkillFilterSchema = z.enum(['all', 'system', 'user']);

export const skillsRouter = router({
  // List skills (paginated with filter and search)
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().uuid().optional(),
        filter: SkillFilterSchema.default('all'),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.skillsFeature.list({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        limit: input.limit,
        cursor: input.cursor,
        filter: input.filter,
        search: input.search,
      });
    }),

  // Get single skill by ID
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const skill = await ctx.skillsFeature.getById({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }
      return skill;
    }),

  // Create a new user skill
  create: orgProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/, {
            message:
              'Key must contain only lowercase letters, numbers, and hyphens',
          }),
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(1000),
        files: z.array(SkillFileSchema).min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalize files (decode base64 if present)
      const normalizedFiles = normalizeSkillFiles(input.files);

      return ctx.skillsFeature.create({
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        files: normalizedFiles,
      });
    }),

  // Update an existing user skill
  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        key: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/, {
            message:
              'Key must contain only lowercase letters, numbers, and hyphens',
          })
          .optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().min(1).max(1000).optional(),
        files: z.array(SkillFileSchema).min(1).max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalize files (decode base64 if present)
      const normalizedFiles = input.files
        ? normalizeSkillFiles(input.files)
        : undefined;

      const updated = await ctx.skillsFeature.update({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        files: normalizedFiles,
      });
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found or you do not have permission to update it',
        });
      }
      return updated;
    }),

  // Delete a user skill
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.skillsFeature.delete({
        id: input.id,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
      });
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found or you do not have permission to delete it',
        });
      }
      return { success: true };
    }),
});
