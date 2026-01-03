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
import { Search } from 'lucide-react';

interface WebSearchCallsItem {
  userId: string;
  callCount: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface WebSearchCallsChartProps {
  data: WebSearchCallsItem[];
  isLoading?: boolean;
}

const VIBRANT_COLORS = [
  '#60a5fa', // blue
  '#34d399', // emerald
  '#a78bfa', // violet
  '#fbbf24', // amber
  '#f472b6', // pink
  '#f87171', // red
  '#2dd4bf', // teal
  '#fb923c', // orange
];

function getUserDisplayName(user: WebSearchCallsItem): string {
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

export function WebSearchCallsChart({
  data,
  isLoading,
}: WebSearchCallsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Web Search Calls
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
          <Search className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Web Search Calls
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
    displayName: getUserDisplayName(item),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Web Search Calls
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical">
            <defs>
              {formattedData.map((_, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`searchBarGradient-${index}`}
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
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [Number(value ?? 0), 'Calls']}
              labelFormatter={(label) => `User: ${label}`}
            />
            <Bar dataKey="callCount" name="Calls" radius={[0, 6, 6, 0]}>
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#searchBarGradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
