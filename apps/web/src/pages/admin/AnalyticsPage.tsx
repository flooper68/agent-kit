import { useEffect } from 'react';
import { Heading, Text } from '@agent-kit/ui';
import {
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';

// Mock data for analytics
const stats = [
  {
    label: 'Total Tasks',
    value: '1,234',
    change: '+12%',
    icon: MessageSquare,
    trend: 'up' as const,
  },
  {
    label: 'Active Users',
    value: '56',
    change: '+4%',
    icon: Users,
    trend: 'up' as const,
  },
  {
    label: 'Avg. Response Time',
    value: '2.3s',
    change: '-8%',
    icon: Clock,
    trend: 'down' as const,
  },
  {
    label: 'Success Rate',
    value: '94.2%',
    change: '+2.1%',
    icon: TrendingUp,
    trend: 'up' as const,
  },
];

const recentActivity = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Created a new task',
    time: '5 minutes ago',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Completed task analysis',
    time: '12 minutes ago',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Invited team member',
    time: '1 hour ago',
  },
  {
    id: 4,
    user: 'Sarah Williams',
    action: 'Updated project settings',
    time: '2 hours ago',
  },
  {
    id: 5,
    user: 'Chris Brown',
    action: 'Started new conversation',
    time: '3 hours ago',
  },
];

export function AnalyticsPage() {
  useEffect(() => {
    document.title = 'Analytics | Agent Kit';
  }, []);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Heading as="h1" size="24">
            Analytics
          </Heading>
          <Text className="text-muted-foreground">
            Overview of your organization&apos;s usage and performance
          </Text>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-sm">
                  {stat.label}
                </span>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{stat.value}</span>
                <span
                  className={`text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-green-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section (Mock) */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Usage Chart Placeholder */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <Heading as="h3" size="16">
                Usage Over Time
              </Heading>
            </div>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <Text>Chart visualization coming soon</Text>
              </div>
            </div>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <Heading as="h3" size="16">
                Task Distribution
              </Heading>
            </div>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <Text>Chart visualization coming soon</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-card p-6">
          <Heading as="h3" size="16" className="mb-4">
            Recent Activity
          </Heading>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {activity.user
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <Text className="font-medium">{activity.user}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {activity.action}
                    </Text>
                  </div>
                </div>
                <Text className="text-sm text-muted-foreground">
                  {activity.time}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
