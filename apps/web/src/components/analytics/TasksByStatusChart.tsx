import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { CheckSquare } from 'lucide-react';

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

interface TasksByStatusChartProps {
  data: TaskStats | undefined;
  isLoading?: boolean;
}

const STATUS_COLORS = {
  todo: '#6b7280', // gray
  in_progress: '#3b82f6', // blue
  review: '#8b5cf6', // violet
  done: '#10b981', // emerald
};

const STATUS_LABELS = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export function TasksByStatusChart({
  data,
  isLoading,
}: TasksByStatusChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Status
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
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Status
          </Heading>
        </div>
        <div className="flex h-64 items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">No tasks available</Text>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tasks by Status
          </Heading>
        </div>
        <Text className="text-muted-foreground text-sm">
          {data.totalTasks} total
        </Text>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [Number(value ?? 0), 'Tasks']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
