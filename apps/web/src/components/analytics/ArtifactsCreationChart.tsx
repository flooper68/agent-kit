import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { FileText } from 'lucide-react';

interface ArtifactsOverTimePoint {
  date: string;
  count: number;
  sizeBytes: number;
}

interface ArtifactsCreationChartProps {
  data: ArtifactsOverTimePoint[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ArtifactsCreationChart({
  data,
  isLoading,
}: ArtifactsCreationChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Artifacts Created
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
            Artifacts Created
          </Heading>
        </div>
        <div className="flex h-64 items-center justify-center rounded-md bg-muted/30">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  const formattedData = data.map((point) => ({
    ...point,
    dateLabel: formatDate(point.date),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Artifacts Created
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorArtifacts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorArtifacts)"
              name="Artifacts"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
