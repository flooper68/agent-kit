import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@agent-kit/server/trpc';

type RouterOutput = inferRouterOutputs<AppRouter>;

// Infer type from tRPC router output to ensure type safety with server
export type ProviderDistributionItem =
  RouterOutput['analytics']['getProviderDistribution'][number];
