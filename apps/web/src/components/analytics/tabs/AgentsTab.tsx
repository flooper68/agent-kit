import { trpc } from '../../../lib/trpc';
import {
  AgentDistributionChart,
  ChartErrorBoundary,
} from '..';
import { ArtifactsByAgentChart } from '../ArtifactsByAgentChart';
import type { TimeRange } from '..';

interface AgentsTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function AgentsTab({ timeRange, userId }: AgentsTabProps) {
  const agentDistQuery = trpc.analytics.getAgentDistribution.useQuery({
    timeRange,
    userId,
  });

  const artifactsByAgentQuery = trpc.artifacts.getByAgent.useQuery({
    timeRange,
  });

  return (
    <div className="space-y-8">
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
    </div>
  );
}
