import type { TimeRange } from '../types';

export function getTimeRangeStart(timeRange: TimeRange): Date | undefined {
  const now = new Date();

  switch (timeRange) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    case 'month': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }
    case 'all':
      return undefined;
    default:
      return undefined;
  }
}

export function getGranularityForTimeRange(
  timeRange: TimeRange
): 'hour' | 'day' | 'week' {
  switch (timeRange) {
    case 'today':
      return 'hour';
    case 'week':
      return 'day';
    case 'month':
      return 'day';
    case 'all':
      return 'week';
    default:
      return 'day';
  }
}
