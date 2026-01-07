/**
 * Unified time formatting utilities
 *
 * This module centralizes all time-related formatting functions
 * to ensure consistent output across the application.
 */

/**
 * Format a duration in seconds to human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "5s" or "1m 23s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format latency in milliseconds to human-readable string.
 * @param ms - Latency in milliseconds
 * @returns Formatted string like "250ms" or "1.50s"
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format a Date to time string (HH:MM).
 * @param date - Date object
 * @returns Formatted time string like "14:30"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a Date to full timestamp string for tooltips.
 * @param date - Date object
 * @returns Formatted string like "Mon, Jan 15, 14:30:45"
 */
export function formatFullTimestamp(date: Date): string {
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format a Date or date string for analytics display.
 * @param date - Date object or ISO string
 * @returns Formatted string like "Jan 15, 2024, 14:30"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
