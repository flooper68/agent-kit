export type TimeRange = 'today' | 'week' | 'month' | 'all';
export type Granularity = 'hour' | 'day' | 'week';

export interface AnalyticsFilters {
  timeRange: TimeRange;
  userId?: string;
}

export interface OverviewStats {
  totalSessions: number;
  activeUsers: number;
  totalCost: number;
  totalTokens: number;
  trends: {
    sessions: number; // percentage change
    users: number;
    cost: number;
    tokens: number;
  };
}

export interface UsageOverTimePoint {
  date: string;
  sessions: number;
  messages: number;
  cost: number;
}

export interface AgentDistributionItem {
  agentId: string;
  agentName: string;
  sessions: number;
  messages: number;
  cost: number;
}

export interface ProviderDistributionItem {
  provider: string;
  sessions: number;
  tokens: number;
  cost: number;
}

export interface RecentActivityItem {
  sessionId: string;
  userId: string;
  agentId: string;
  agentName: string;
  title: string | null;
  status: string;
  messageCount: number;
  updatedAt: Date;
}

export interface PaginatedRecentActivity {
  items: RecentActivityItem[];
  nextCursor: string | undefined;
}
