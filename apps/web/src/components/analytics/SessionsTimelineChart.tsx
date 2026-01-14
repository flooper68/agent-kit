import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Heading, Text } from '@agent-kit/ui';
import { Clock } from 'lucide-react';

interface SessionTimelineEntry {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

interface SessionTimelineUser {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  sessions: SessionTimelineEntry[];
}

interface SessionsTimelineChartProps {
  data: SessionTimelineUser[];
  timeRange: { start: string; end: string };
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

function getUserDisplayName(user: SessionTimelineUser): string {
  if (user.firstName || user.lastName) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name.length > 12 ? name.slice(0, 12) + '...' : name;
  }
  if (user.email) {
    return user.email.length > 12 ? user.email.slice(0, 12) + '...' : user.email;
  }
  return user.userId.length > 10 ? user.userId.slice(0, 10) + '...' : user.userId;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface FlattenedSession {
  userName: string;
  userIndex: number;
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  startedAt: string;
  endedAt: string | null;
}

export function SessionsTimelineChart({
  data,
  timeRange,
  isLoading,
}: SessionsTimelineChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Sessions Timeline
          </Heading>
        </div>
        <div className="h-80 flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Sessions Timeline
          </Heading>
        </div>
        <div className="h-80 flex items-center justify-center bg-muted/30 rounded-md">
          <Text className="text-muted-foreground">No sessions available</Text>
        </div>
      </div>
    );
  }

  const rangeStart = new Date(timeRange.start).getTime();
  const rangeEnd = new Date(timeRange.end).getTime();
  const rangeDuration = rangeEnd - rangeStart;

  // Flatten sessions for the chart - each session becomes a bar
  const flattenedSessions: FlattenedSession[] = [];
  data.forEach((user, userIndex) => {
    const userName = getUserDisplayName(user);
    user.sessions.forEach((session) => {
      const startTime = new Date(session.startedAt).getTime();
      const endTime = session.endedAt
        ? new Date(session.endedAt).getTime()
        : new Date().getTime();

      flattenedSessions.push({
        userName,
        userIndex,
        sessionId: session.id,
        startTime,
        endTime,
        duration: session.durationMinutes,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      });
    });
  });

  // Create data for stacked bar chart approach
  // Each bar needs: offset (transparent) + duration (colored)
  const chartData = flattenedSessions.map((session) => ({
    ...session,
    // Offset from range start (transparent portion)
    offset: ((session.startTime - rangeStart) / rangeDuration) * 100,
    // Duration as percentage of range
    length: ((session.endTime - session.startTime) / rangeDuration) * 100,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Sessions Timeline
        </Heading>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap={2}
            barGap={1}
          >
            <defs>
              {data.map((_, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`sessionGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
                    stopOpacity={0.7}
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
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#888' }}
              tickFormatter={(value) => {
                const time = new Date(
                  rangeStart + (value / 100) * rangeDuration
                );
                return time.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
              }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <YAxis
              type="category"
              dataKey="userName"
              tick={{ fontSize: 11, fill: '#888' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const session = payload[0]?.payload as FlattenedSession;
                  if (!session) return null;
                  return (
                    <div className="p-3 space-y-1">
                      <p className="font-medium">{session.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {formatTime(new Date(session.startedAt))}
                      </p>
                      {session.endedAt && (
                        <p className="text-sm text-muted-foreground">
                          Ended: {formatTime(new Date(session.endedAt))}
                        </p>
                      )}
                      <p className="text-sm font-medium">
                        Duration: {formatDuration(session.duration)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Transparent offset bar */}
            <Bar dataKey="offset" stackId="session" fill="transparent" />
            {/* Colored session duration bar */}
            <Bar
              dataKey="length"
              stackId="session"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#sessionGradient-${entry.userIndex})`}
                />
              ))}
            </Bar>
            {/* Current time reference line */}
            <ReferenceLine
              x={100}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {data.map((user, index) => (
          <div key={user.userId} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: VIBRANT_COLORS[index % VIBRANT_COLORS.length],
              }}
            />
            <span className="text-muted-foreground">
              {getUserDisplayName(user)} ({user.sessions.length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
