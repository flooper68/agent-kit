import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { BarChart3 } from 'lucide-react';

interface AgentDistributionItem {
  agentId: string;
  agentName: string;
  sessions: number;
  messages: number;
  cost: number;
}

interface AgentDistributionChartProps {
  data: AgentDistributionItem[];
  isLoading?: boolean;
}

const VIBRANT_COLORS = [
  '#f472b6', // pink
  '#a78bfa', // violet
  '#60a5fa', // blue
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // red
  '#2dd4bf', // teal
  '#fb923c', // orange
];

function truncateName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

export function AgentDistributionChart({
  data,
  isLoading,
}: AgentDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Agent Distribution
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
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Agent Distribution
          </Heading>
        </div>
        <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
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
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Agent Distribution
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical">
            <defs>
              {formattedData.map((_, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`barGradient-${index}`}
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
              formatter={(value, name) => {
                const numValue = Number(value ?? 0);
                if (name === 'cost') return [`$${numValue.toFixed(2)}`, 'Cost'];
                return [
                  numValue,
                  name === 'sessions' ? 'Sessions' : 'Messages',
                ];
              }}
            />
            <Legend />
            <Bar dataKey="sessions" name="Sessions" radius={[0, 6, 6, 0]}>
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#barGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
