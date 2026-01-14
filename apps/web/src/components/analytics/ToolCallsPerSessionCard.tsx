import { Heading, Text } from '@agent-kit/ui';
import { Wrench, Hash, TrendingUp, Maximize2 } from 'lucide-react';

interface ToolCallsPerSessionStats {
  totalSessions: number;
  totalToolCalls: number;
  avgToolCallsPerSession: number;
  maxToolCallsInSession: number;
}

interface ToolCallsPerSessionCardProps {
  data: ToolCallsPerSessionStats | undefined;
  isLoading?: boolean;
}

export function ToolCallsPerSessionCard({
  data,
  isLoading,
}: ToolCallsPerSessionCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Calls per Session
          </Heading>
        </div>
        <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Calls per Session
          </Heading>
        </div>
        <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Tool Calls',
      value: data.totalToolCalls.toLocaleString(),
      icon: Hash,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Sessions with Tools',
      value: data.totalSessions.toLocaleString(),
      icon: Wrench,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Avg per Session',
      value: data.avgToolCallsPerSession.toFixed(1),
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Max in Session',
      value: data.maxToolCallsInSession.toLocaleString(),
      icon: Maximize2,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Tool Calls per Session
        </Heading>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
          >
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <div className="text-lg font-semibold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
