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
import { Coins } from 'lucide-react';

interface TokensPerUserItem {
  userId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  sessions: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface TokensPerUserChartProps {
  data: TokensPerUserItem[];
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

function getUserDisplayName(user: TokensPerUserItem): string {
  // Prefer full name, then email, then truncated userId
  if (user.firstName || user.lastName) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name.length > 15 ? name.slice(0, 15) + '...' : name;
  }
  if (user.email) {
    return user.email.length > 15
      ? user.email.slice(0, 15) + '...'
      : user.email;
  }
  // Fallback to truncated user ID
  return user.userId.length > 12
    ? user.userId.slice(0, 12) + '...'
    : user.userId;
}

function formatTokens(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function TokensPerUserChart({
  data,
  isLoading,
}: TokensPerUserChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tokens Per User
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
          <Coins className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tokens Per User
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
    displayName: getUserDisplayName(item),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Tokens Per User
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical">
            <defs>
              {formattedData.map((_, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`tokenBarGradient-${index}`}
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
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#888' }}
              tickFormatter={formatTokens}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 11, fill: '#888' }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [
                formatTokens(Number(value ?? 0)),
                'Total Tokens',
              ]}
              labelFormatter={(label) => `User: ${label}`}
            />
            <Bar
              dataKey="totalTokens"
              name="Total Tokens"
              radius={[0, 6, 6, 0]}
            >
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#tokenBarGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
