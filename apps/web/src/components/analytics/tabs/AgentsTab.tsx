import { trpc } from '../../../lib/trpc';
import {
  AgentDistributionChart,
  TokensPerUserChart,
  WebSearchCallsChart,
  TokensByProviderChart,
  SessionLengthChart,
  ToolTypeDistributionChart,
  ToolCallsPerSessionCard,
  ToolCallErrorsChart,
  ChartErrorBoundary,
} from '..';
import { ArtifactsByAgentChart } from '../ArtifactsByAgentChart';
import type { TimeRange } from '..';

interface AgentsTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function AgentsTab({ timeRange, userId }: AgentsTabProps) {
  // Agent distribution queries
  const agentDistQuery = trpc.analytics.getAgentDistribution.useQuery({
    timeRange,
    userId,
  });

  const artifactsByAgentQuery = trpc.artifacts.getByAgent.useQuery({
    timeRange,
  });

  // User analytics queries (moved from UsersSessionsTab)
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

  // Tool analytics queries (moved from ToolsTab)
  const sessionLengthQuery =
    trpc.analytics.getSessionLengthDistribution.useQuery({
      timeRange,
      userId,
    });

  const toolCallsPerSessionQuery =
    trpc.analytics.getToolCallsPerSession.useQuery({
      timeRange,
      userId,
    });

  const toolTypeDistributionQuery =
    trpc.analytics.getToolTypeDistribution.useQuery({
      timeRange,
      userId,
    });

  const toolCallErrorsQuery = trpc.analytics.getToolCallErrors.useQuery({
    timeRange,
    userId,
  });

  return (
    <div className="space-y-8">
      {/* Agent Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Agent Distribution">
          <AgentDistributionChart
            data={agentDistQuery.data ?? []}
            isLoading={agentDistQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Artifacts by Agent">
          <ArtifactsByAgentChart
            data={artifactsByAgentQuery.data ?? []}
            isLoading={artifactsByAgentQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>

      {/* User Analytics */}
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

      {/* Tool Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Messages per Session">
          <SessionLengthChart
            data={sessionLengthQuery.data ?? []}
            isLoading={sessionLengthQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Tool Type Distribution">
          <ToolTypeDistributionChart
            data={toolTypeDistributionQuery.data ?? []}
            isLoading={toolTypeDistributionQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tool Calls per Session">
          <ToolCallsPerSessionCard
            data={toolCallsPerSessionQuery.data}
            isLoading={toolCallsPerSessionQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Tool Call Errors">
          <ToolCallErrorsChart
            data={toolCallErrorsQuery.data}
            isLoading={toolCallErrorsQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
