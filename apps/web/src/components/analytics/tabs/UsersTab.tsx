import { trpc } from '../../../lib/trpc';
import {
  TokensPerUserChart,
  WebSearchCallsChart,
  TokensByProviderChart,
  ChartErrorBoundary,
} from '..';
import type { TimeRange } from '..';

interface UsersTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function UsersTab({ timeRange, userId }: UsersTabProps) {
  const tokensPerUserQuery = trpc.analytics.getTokensPerUser.useQuery({
    timeRange,
    userId,
  });

  const webSearchCallsQuery = trpc.analytics.getWebSearchCalls.useQuery({
    timeRange,
    userId,
  });

  const providerDistQuery = trpc.analytics.getProviderDistribution.useQuery({
    timeRange,
    userId,
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tokens Per User">
          <TokensPerUserChart
            data={tokensPerUserQuery.data ?? []}
            isLoading={tokensPerUserQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Web Search Calls">
          <WebSearchCallsChart
            data={webSearchCallsQuery.data ?? []}
            isLoading={webSearchCallsQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tokens by Provider">
          <TokensByProviderChart
            data={providerDistQuery.data ?? []}
            isLoading={providerDistQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
