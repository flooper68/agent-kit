import { useEffect } from 'react';
import { Heading, Text, Tabs } from '@agent-kit/ui';
import {
  BarChart3,
  Activity,
  Bot,
  Users,
  FileText,
} from 'lucide-react';
import {
  TimeRangeSelector,
  UserSelector,
  OverviewTab,
  SessionsCostsTab,
  AgentsTab,
  UsersTab,
  ActivityTab,
} from '../../components/analytics';
import type { TimeRange } from '../../components/analytics';
import { useUrlState } from '../../hooks/useUrlState';

type AnalyticsTabValue = 'overview' | 'sessions' | 'agents' | 'users' | 'activity';

const validTabs: AnalyticsTabValue[] = ['overview', 'sessions', 'agents', 'users', 'activity'];

const tabLabels: Record<AnalyticsTabValue, { label: string; icon: React.ReactNode }> = {
  overview: { label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  sessions: { label: 'Sessions & Costs', icon: <Activity className="h-4 w-4" /> },
  agents: { label: 'Agents', icon: <Bot className="h-4 w-4" /> },
  users: { label: 'Users', icon: <Users className="h-4 w-4" /> },
  activity: { label: 'Activity', icon: <FileText className="h-4 w-4" /> },
};

export function AnalyticsPage() {
  // URL state for tab
  const [activeTab, setActiveTab] = useUrlState<AnalyticsTabValue>('tab', {
    defaultValue: 'overview',
    parse: (value) => {
      if (value && validTabs.includes(value as AnalyticsTabValue)) {
        return value as AnalyticsTabValue;
      }
      return 'overview';
    },
    serialize: (value) => (value === 'overview' ? undefined : value),
  });

  // URL state for time range
  const [timeRange, setTimeRange] = useUrlState<TimeRange>('timeRange', {
    defaultValue: 'month',
    parse: (value) => {
      const validRanges: TimeRange[] = ['today', 'week', 'month', 'all'];
      if (value && validRanges.includes(value as TimeRange)) {
        return value as TimeRange;
      }
      return 'month';
    },
    serialize: (value) => (value === 'month' ? undefined : value),
  });

  // URL state for user filter
  const [userId, setUserId] = useUrlState('userId', {
    defaultValue: '',
  });

  useEffect(() => {
    document.title = 'Analytics | Agent Kit';
  }, []);

  // Convert empty string to undefined for API calls
  const userIdFilter = userId || undefined;

  const handleTabChange = (value: string) => {
    setActiveTab(value as AnalyticsTabValue);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Heading as="h1" size="24">
              Analytics
            </Heading>
            <Text className="text-muted-foreground">
              Overview of your organization&apos;s usage and performance
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <UserSelector
              value={userId}
              onChange={setUserId}
              timeRange={timeRange}
            />
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List className="mb-6">
            {validTabs.map((tab) => (
              <Tabs.Trigger key={tab} value={tab}>
                {tabLabels[tab].icon}
                {tabLabels[tab].label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="overview">
            <OverviewTab timeRange={timeRange} userId={userIdFilter} />
          </Tabs.Content>

          <Tabs.Content value="sessions">
            <SessionsCostsTab timeRange={timeRange} userId={userIdFilter} />
          </Tabs.Content>

          <Tabs.Content value="agents">
            <AgentsTab timeRange={timeRange} userId={userIdFilter} />
          </Tabs.Content>

          <Tabs.Content value="users">
            <UsersTab timeRange={timeRange} userId={userIdFilter} />
          </Tabs.Content>

          <Tabs.Content value="activity">
            <ActivityTab userId={userIdFilter} />
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  );
}
