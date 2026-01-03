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
import { FileText } from 'lucide-react';

interface ArtifactsByAgent {
  agentId: string | null;
  agentName: string;
  count: number;
}

interface ArtifactsByAgentChartProps {
  data: ArtifactsByAgent[];
  isLoading?: boolean;
}

const VIBRANT_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

function truncateName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

export function ArtifactsByAgentChart({
  data,
  isLoading,
}: ArtifactsByAgentChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Artifacts by Agent
          </Heading>
        </div>
        <div className="flex h-64 animate-pulse items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Artifacts by Agent
          </Heading>
        </div>
        <div className="flex h-64 items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    displayName: truncateName(item.agentName),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Artifacts by Agent
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical">
            <defs>
              {formattedData.map((_, index) => (
                <linearGradient
                  key={`gradient-artifacts-${index}`}
                  id={`artifactBarGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
                    stopOpacity={1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 11, fill: '#888' }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [Number(value ?? 0), 'Artifacts']}
            />
            <Bar dataKey="count" name="Artifacts" radius={[0, 6, 6, 0]}>
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#artifactBarGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
