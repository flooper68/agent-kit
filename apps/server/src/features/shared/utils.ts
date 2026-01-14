import type { TimeRange } from './types';

/**
 * Calculate the start date for a given time range.
 * Returns null for 'all' time range (no start date filter).
 */
export function getStartDate(timeRange: TimeRange): Date | null {
  const now = new Date();
  switch (timeRange) {
    case 'today': {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    case 'week': {
      const date = new Date(now);
      date.setDate(date.getDate() - 7);
      return date;
    }
    case 'month': {
      const date = new Date(now);
      date.setDate(date.getDate() - 30);
      return date;
    }
    case 'all':
      return null;
  }
}

/**
 * Get the number of days in a time range.
 * Used for calculating averages and other aggregations.
 */
export function getDaysInRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case 'today':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'all':
      return 90;
  }
}
