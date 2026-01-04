import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { Layers } from 'lucide-react';

interface ProviderDistributionItem {
  provider: string;
  sessions: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

interface TokensByProviderChartProps {
  data: ProviderDistributionItem[];
  isLoading?: boolean;
}

function formatProvider(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google',
    unknown: 'Unknown',
  };
  return names[provider.toLowerCase()] ?? provider;
}

function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

export function TokensByProviderChart({
  data,
  isLoading,
}: TokensByProviderChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tokens by Provider
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
          <Layers className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tokens by Provider
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
    name: formatProvider(item.provider),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Tokens by Provider
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              tickFormatter={formatTokenCount}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value, name) => [
                formatTokenCount(Number(value ?? 0)),
                name === 'promptTokens' ? 'Input Tokens' : 'Output Tokens',
              ]}
              labelFormatter={(label) => String(label)}
            />
            <Legend
              formatter={(value) =>
                value === 'promptTokens' ? 'Input Tokens' : 'Output Tokens'
              }
            />
            <Bar
              dataKey="promptTokens"
              stackId="tokens"
              fill="#60a5fa"
              radius={[0, 0, 0, 0]}
              name="promptTokens"
            />
            <Bar
              dataKey="completionTokens"
              stackId="tokens"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              name="completionTokens"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
