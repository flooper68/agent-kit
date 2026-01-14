import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { Wrench } from 'lucide-react';

interface ToolTypeDistributionItem {
  toolName: string;
  callCount: number;
  percentage: number;
}

interface ToolTypeDistributionChartProps {
  data: ToolTypeDistributionItem[];
  isLoading?: boolean;
}

const TOOL_COLORS = [
  '#60a5fa', // blue
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#f87171', // red
  '#2dd4bf', // teal
  '#fb923c', // orange
  '#818cf8', // indigo
  '#4ade80', // green
  '#facc15', // yellow
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
];

function formatToolName(name: string): string {
  // Handle MCP tools: mcp__server__toolName -> Server: Tool Name
  if (name.startsWith('mcp__')) {
    const parts = name.split('__');
    if (parts.length >= 3) {
      const serverName = parts[1] ?? '';
      const toolName = parts.slice(2).join('__');
      return `${serverName}: ${formatCamelCase(toolName)}`;
    }
  }
  return formatCamelCase(name);
}

function formatCamelCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function truncateName(name: string, maxLength = 25): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

export function ToolTypeDistributionChart({
  data,
  isLoading,
}: ToolTypeDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Usage Distribution
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
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Usage Distribution
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
    displayName: truncateName(formatToolName(item.toolName)),
    color: TOOL_COLORS[index % TOOL_COLORS.length],
  }));

  const totalCalls = data.reduce((acc, item) => acc + item.callCount, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Tool Usage Distribution
        </Heading>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {formattedData.map((item, index) => (
                <linearGradient
                  key={`pieGradient-${index}`}
                  id={`toolPieGradient-${index}`}
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
              paddingAngle={2}
              dataKey="callCount"
              nameKey="displayName"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {formattedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#toolPieGradient-${index})`}
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
              formatter={(value, _name, props) => {
                const item = props.payload as (typeof formattedData)[number];
                return [
                  `${value} calls (${item.percentage}%)`,
                  formatToolName(item.toolName),
                ];
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
              wrapperStyle={{ fontSize: '11px' }}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan x="50%" dy="-0.5em" fontSize="16" fontWeight="700">
                {totalCalls.toLocaleString()}
              </tspan>
              <tspan
                x="50%"
                dy="1.5em"
                fontSize="11"
                className="fill-muted-foreground"
              >
                Total Calls
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
