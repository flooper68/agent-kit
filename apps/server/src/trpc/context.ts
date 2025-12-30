import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext() {
  return ({ req, res }: CreateFastifyContextOptions) => {
    return {
      req,
      res,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;
