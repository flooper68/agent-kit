import type { createClerkClient } from '@clerk/backend';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { AuthContext } from '../types/auth.js';

export type ClerkClient = ReturnType<typeof createClerkClient>;

export function createContext(clerk: ClerkClient) {
  return ({ req, res }: CreateFastifyContextOptions) => {
    // Type assertion needed because Fastify module augmentation is local to server package and the infer will not work in frontend package
    const auth = (req as unknown as { auth: AuthContext }).auth;

    return {
      req,
      res,
      auth: {
        userId: auth.userId,
        orgId: auth.orgId,
        orgRole: auth.orgRole,
      },
      clerk,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
