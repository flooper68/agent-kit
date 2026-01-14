export type TimeRange = 'today' | 'week' | 'month' | 'all';
export type Granularity = 'hour' | 'day' | 'week';

export interface ClerkUserInfo {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export type WithClerkUserInfo<T> = T & ClerkUserInfo;
