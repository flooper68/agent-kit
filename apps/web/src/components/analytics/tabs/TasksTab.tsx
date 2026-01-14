import { trpc } from '../../../lib/trpc';
import { TasksByStatusChart, TasksByPriorityChart, ChartErrorBoundary } from '..';
import { ArtifactsCreationChart } from '../ArtifactsCreationChart';
import type { TimeRange } from '..';

interface TasksTabProps {
  timeRange: TimeRange;
  userId?: string;
}

export function TasksTab({ timeRange, userId: _userId }: TasksTabProps) {
  // Note: getTaskStats and getOverTime don't support userId filtering yet
  const taskStatsQuery = trpc.analytics.getTaskStats.useQuery();

  const artifactsOverTimeQuery = trpc.artifacts.getOverTime.useQuery({
    timeRange,
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Tasks by Status">
          <TasksByStatusChart
            data={taskStatsQuery.data}
            isLoading={taskStatsQuery.isLoading}
          />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Tasks by Priority">
          <TasksByPriorityChart
            data={taskStatsQuery.data}
            isLoading={taskStatsQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartErrorBoundary chartName="Artifacts Created">
          <ArtifactsCreationChart
            data={artifactsOverTimeQuery.data ?? []}
            isLoading={artifactsOverTimeQuery.isLoading}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
