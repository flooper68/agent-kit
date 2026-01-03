import type { TimeRange } from '../types';

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
