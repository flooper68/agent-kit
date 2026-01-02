import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { DollarSign } from 'lucide-react';

interface ProviderDistributionItem {
  provider: string;
  sessions: number;
  tokens: number;
  cost: number;
}

interface CostBreakdownChartProps {
  data: ProviderDistributionItem[];
  isLoading?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10b981', // emerald
  anthropic: '#f59e0b', // amber
  gemini: '#3b82f6', // blue
  unknown: '#6b7280', // gray
};

const FALLBACK_COLORS = [
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

function getProviderColor(provider: string, index: number): string {
  const providerColor = PROVIDER_COLORS[provider.toLowerCase()];
  if (providerColor) return providerColor;
  const fallbackColor = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return fallbackColor ?? '#6b7280';
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

export function CostBreakdownChart({
  data,
  isLoading,
}: CostBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Cost by Provider
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
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Cost by Provider
          </Heading>
        </div>
        <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  const formattedData = data.map((item, index) => ({
    ...item,
    name: formatProvider(item.provider),
    color: getProviderColor(item.provider, index),
  }));

  const totalCost = data.reduce((acc, item) => acc + item.cost, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Cost by Provider
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {formattedData.map((item, index) => (
                <linearGradient
                  key={`pieGradient-${index}`}
                  id={`pieGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={item.color}
                    stopOpacity={0.7}
                  />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="cost"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGradient-${index})`}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value) => [
                `$${Number(value ?? 0).toFixed(2)}`,
                'Cost',
              ]}
            />
            <Legend
              formatter={(value, entry) => (
                <span
                  className="text-sm"
                  style={{ color: (entry as { color?: string }).color }}
                >
                  {value}
                </span>
              )}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan x="50%" dy="-0.5em" fontSize="16" fontWeight="700">
                ${totalCost.toFixed(2)}
              </tspan>
              <tspan
                x="50%"
                dy="1.5em"
                fontSize="11"
                className="fill-muted-foreground"
              >
                Total Cost
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
