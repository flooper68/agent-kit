import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { AlertTriangle } from 'lucide-react';

interface TaskStats {
  totalTasks: number;
  byStatus: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  completedThisWeek: number;
}

interface TasksByPriorityChartProps {
  data: TaskStats | undefined;
  isLoading?: boolean;
}

const PRIORITY_COLORS = {
  low: '#6b7280', // gray
  medium: '#3b82f6', // blue
  high: '#f59e0b', // amber
  urgent: '#ef4444', // red
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TasksByPriorityChart({
  data,
  isLoading,
}: TasksByPriorityChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Priority
          </Heading>
        </div>
        <div className="flex h-64 animate-pulse items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data || data.totalTasks === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Priority
          </Heading>
        </div>
        <div className="flex h-64 items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">No tasks available</Text>
        </div>
      </div>
    );
  }

  const chartData = ['low', 'medium', 'high', 'urgent'].map((priority) => ({
    name: PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS],
    value: data.byPriority[priority as keyof typeof data.byPriority],
    color: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS],
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Priority
          </Heading>
        </div>
        <span className="text-sm text-emerald-500">
          {data.completedThisWeek} completed this week
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <defs>
              {chartData.map((entry, index) => (
                <linearGradient
                  key={`gradient-priority-${index}`}
                  id={`priorityBarGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={entry.color}
                    stopOpacity={0.6}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#888' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#888' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [Number(value ?? 0), 'Tasks']}
            />
            <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#priorityBarGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
