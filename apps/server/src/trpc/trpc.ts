import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from './context';
import { OrgRole } from '../types/auth';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware - requires signed in user
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        orgRole: ctx.auth.orgRole,
      },
    },
  });
});

// Org middleware - requires active organization
const hasOrganization = middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to perform this action',
    });
  }

  if (!ctx.auth.orgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must select a project to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        orgRole: ctx.auth.orgRole,
      },
    },
  });
});

// Admin middleware - requires org:admin role
const isOrgAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId || !ctx.auth.orgId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in and have a project selected',
    });
  }

  const isAdmin =
    ctx.auth.orgRole === OrgRole.enum['org:admin'] ||
    ctx.auth.orgRole === OrgRole.enum['super_admin'];

  if (!isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a project admin to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        orgRole: ctx.auth.orgRole,
      },
    },
  });
});

// Error handling middleware - catches errors and converts to TRPCError with safe messages
const handleErrors = middleware(async ({ ctx, next, path }) => {
  try {
    return await next();
  } catch (error) {
    // Log the actual error for debugging, but don't expose it to the client
    ctx.req.log.error(
      { err: error, path },
      'Unhandled error in tRPC procedure'
    );

    if (error instanceof TRPCError) throw error;

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

// Session ownership middleware - verifies the user owns the session
// Input must have sessionId field
const ownsSession = middleware(async (opts) => {
  const { ctx, next, getRawInput } = opts;

  if (!ctx.auth.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to perform this action',
    });
  }

  // Parse sessionId from input
  const inputSchema = z.object({
    sessionId: z.string().uuid(),
  });

  const rawInput = await getRawInput();
  const result = inputSchema.safeParse(rawInput);

  if (!result.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid session ID',
    });
  }

  const { sessionId } = result.data;

  // Verify ownership using agentsFeature
  // Pass orgId to prevent cross-tenant access when user switches organizations
  const ownsSession = await ctx.agentsFeature.sessions.verifyOwnership(
    sessionId,
    ctx.auth.userId,
    ctx.auth.orgId ?? undefined
  );

  if (!ownsSession) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Session not found',
    });
  }

  return next({
    ctx: {
      ...ctx,
      sessionId,
      auth: {
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        orgRole: ctx.auth.orgRole,
      },
    },
  });
});

// Protected procedures
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const orgProcedure = t.procedure.use(hasOrganization).use(handleErrors);
export const adminProcedure = t.procedure.use(isOrgAdmin).use(handleErrors);

// Session-specific procedure - requires authenticated user and validates session ownership
export const sessionProcedure = t.procedure
  .use(isAuthenticated)
  .use(ownsSession);
