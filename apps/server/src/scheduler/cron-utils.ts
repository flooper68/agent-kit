import { Cron } from 'croner';

/**
 * Calculate the next run time for a cron expression in the given timezone
 * @param cronExpression - A valid cron expression (5 or 6 fields)
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'UTC')
 * @returns The next execution date
 */
export function calculateNextRunAt(
  cronExpression: string,
  timezone: string
): Date {
  const cron = new Cron(cronExpression, { timezone });
  const nextRun = cron.nextRun();

  if (!nextRun) {
    throw new Error(
      `Unable to calculate next run time for cron expression: ${cronExpression}`
    );
  }

  return nextRun;
}

/**
 * Validate a cron expression
 * @param cronExpression - The cron expression to validate
 * @returns true if valid, false otherwise
 */
export function validateCronExpression(cronExpression: string): boolean {
  try {
    // Croner will throw if the expression is invalid
    new Cron(cronExpression);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a human-readable description of when the next run will occur
 * @param cronExpression - A valid cron expression
 * @param timezone - IANA timezone string
 * @returns Human-readable next run description
 */
export function getNextRunDescription(
  cronExpression: string,
  timezone: string
): string {
  try {
    const nextRun = calculateNextRunAt(cronExpression, timezone);
    return nextRun.toLocaleString('en-US', { timeZone: timezone });
  } catch {
    return 'Unable to calculate';
  }
}
