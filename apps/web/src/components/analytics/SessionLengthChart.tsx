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
import { MessageSquare } from 'lucide-react';

interface SessionLengthBucket {
  bucket: string;
  sessionCount: number;
}

interface SessionLengthChartProps {
  data: SessionLengthBucket[];
  isLoading?: boolean;
}

const BUCKET_COLORS = [
  '#60a5fa', // blue - 1-5
  '#34d399', // emerald - 6-10
  '#fbbf24', // amber - 11-20
  '#f87171', // red - 21-50
  '#a78bfa', // violet - 50+
];

export function SessionLengthChart({
  data,
  isLoading,
}: SessionLengthChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Messages per Session
          </Heading>
        </div>
        <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Messages per Session
          </Heading>
        </div>
        <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Messages per Session
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              {data.map((_, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`sessionGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={BUCKET_COLORS[index % BUCKET_COLORS.length]}
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor={BUCKET_COLORS[index % BUCKET_COLORS.length]}
                    stopOpacity={0.7}
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
              dataKey="bucket"
              tick={{ fontSize: 12, fill: '#888' }}
              label={{
                value: 'Messages',
                position: 'insideBottom',
                offset: -5,
                fontSize: 11,
                fill: '#888',
              }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#888' }}
              label={{
                value: 'Sessions',
                angle: -90,
                position: 'insideLeft',
                fontSize: 11,
                fill: '#888',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [value, 'Sessions']}
              labelFormatter={(label) => `${label} messages`}
            />
            <Bar dataKey="sessionCount" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#sessionGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
