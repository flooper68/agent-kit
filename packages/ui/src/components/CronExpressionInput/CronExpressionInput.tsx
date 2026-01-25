import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, '0'),
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, '0'),
}));

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: (i + 1).toString(),
}));

export interface CronExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  showPreview?: boolean;
  className?: string;
  disabled?: boolean;
}

interface ParsedCron {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

function parseCron(expression: string): ParsedCron | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0] ?? '*',
    hour: parts[1] ?? '*',
    dayOfMonth: parts[2] ?? '*',
    month: parts[3] ?? '*',
    dayOfWeek: parts[4] ?? '*',
  };
}

function buildCron(parsed: ParsedCron): string {
  return `${parsed.minute} ${parsed.hour} ${parsed.dayOfMonth} ${parsed.month} ${parsed.dayOfWeek}`;
}

function detectFrequency(cron: ParsedCron): Frequency {
  const { minute, hour, dayOfMonth, dayOfWeek } = cron;

  // Hourly: specific minute, * for hour
  if (
    minute !== '*' &&
    hour === '*' &&
    dayOfMonth === '*' &&
    dayOfWeek === '*'
  ) {
    return 'hourly';
  }

  // Daily: specific time, * for day
  if (
    minute !== '*' &&
    hour !== '*' &&
    dayOfMonth === '*' &&
    dayOfWeek === '*'
  ) {
    return 'daily';
  }

  // Weekly: specific time and day of week
  if (
    minute !== '*' &&
    hour !== '*' &&
    dayOfMonth === '*' &&
    dayOfWeek !== '*'
  ) {
    return 'weekly';
  }

  // Monthly: specific time and day of month
  if (
    minute !== '*' &&
    hour !== '*' &&
    dayOfMonth !== '*' &&
    dayOfWeek === '*'
  ) {
    return 'monthly';
  }

  return 'custom';
}

function getCronDescription(expression: string): string {
  const parsed = parseCron(expression);
  if (!parsed) return 'Invalid cron expression';

  const { minute, hour, dayOfMonth, dayOfWeek } = parsed;

  const frequency = detectFrequency(parsed);

  const formatTime = (h: string, m: string) => {
    const hourNum = parseInt(h, 10);
    const minNum = parseInt(m, 10);
    if (isNaN(hourNum) || isNaN(minNum)) return '';
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minNum.toString().padStart(2, '0')} ${period}`;
  };

  switch (frequency) {
    case 'hourly':
      return `Every hour at minute ${minute}`;
    case 'daily':
      return `Every day at ${formatTime(hour, minute)}`;
    case 'weekly': {
      const days = dayOfWeek.split(',').map((d) => {
        const dayNum = parseInt(d, 10);
        return DAYS_OF_WEEK.find((day) => day.value === dayNum)?.label ?? d;
      });
      const dayRange = dayOfWeek.includes('-')
        ? dayOfWeek
            .split('-')
            .map((d) => {
              const dayNum = parseInt(d, 10);
              return (
                DAYS_OF_WEEK.find((day) => day.value === dayNum)?.label ?? d
              );
            })
            .join(' through ')
        : days.join(', ');
      return `At ${formatTime(hour, minute)}, ${dayRange}`;
    }
    case 'monthly':
      return `At ${formatTime(hour, minute)} on day ${dayOfMonth} of the month`;
    default:
      return expression;
  }
}

export function CronExpressionInput({
  value,
  onChange,
  showPreview = true,
  className,
  disabled,
}: CronExpressionInputProps) {
  const parsed = useMemo(
    () =>
      parseCron(value) || {
        minute: '0',
        hour: '9',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*',
      },
    [value]
  );

  const [frequency, setFrequency] = useState<Frequency>(() =>
    detectFrequency(parsed)
  );
  const [selectedMinute, setSelectedMinute] = useState(() =>
    parsed.minute === '*' ? '0' : parsed.minute
  );
  const [selectedHour, setSelectedHour] = useState(() =>
    parsed.hour === '*' ? '9' : parsed.hour
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (parsed.dayOfWeek === '*') return [1, 2, 3, 4, 5]; // Mon-Fri default
    return parsed.dayOfWeek
      .split(',')
      .map((d) => parseInt(d, 10))
      .filter((n) => !isNaN(n));
  });
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(() =>
    parsed.dayOfMonth === '*' ? '1' : parsed.dayOfMonth
  );
  const [customExpression, setCustomExpression] = useState(value);

  // Update the cron expression when inputs change
  const updateCron = useCallback(() => {
    let newCron: string;

    switch (frequency) {
      case 'hourly':
        newCron = buildCron({
          minute: selectedMinute,
          hour: '*',
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
        });
        break;
      case 'daily':
        newCron = buildCron({
          minute: selectedMinute,
          hour: selectedHour,
          dayOfMonth: '*',
          month: '*',
          dayOfWeek: '*',
        });
        break;
      case 'weekly':
        newCron = buildCron({
          minute: selectedMinute,
          hour: selectedHour,
          dayOfMonth: '*',
          month: '*',
          dayOfWeek:
            selectedDays.length > 0
              ? selectedDays.sort((a, b) => a - b).join(',')
              : '*',
        });
        break;
      case 'monthly':
        newCron = buildCron({
          minute: selectedMinute,
          hour: selectedHour,
          dayOfMonth: selectedDayOfMonth,
          month: '*',
          dayOfWeek: '*',
        });
        break;
      case 'custom':
        newCron = customExpression;
        break;
      default:
        newCron = value;
    }

    if (newCron !== value) {
      onChange(newCron);
    }
  }, [
    frequency,
    selectedMinute,
    selectedHour,
    selectedDays,
    selectedDayOfMonth,
    customExpression,
    value,
    onChange,
  ]);

  // Update cron when any dependency changes
  useEffect(() => {
    updateCron();
  }, [updateCron]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const description = useMemo(() => getCronDescription(value), [value]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Frequency selector */}
      <div className="flex flex-wrap gap-1">
        {(['hourly', 'daily', 'weekly', 'monthly', 'custom'] as const).map(
          (freq) => (
            <button
              key={freq}
              type="button"
              disabled={disabled}
              onClick={() => setFrequency(freq)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                frequency === freq
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Frequency-specific controls */}
      {frequency !== 'custom' && (
        <div className="space-y-4">
          {/* Time selector */}
          {frequency !== 'hourly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Run at</span>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                disabled={disabled}
                className={cn(
                  'h-9 rounded-md border border-input bg-background px-2 text-sm',
                  'focus:outline-none focus:ring-1 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">:</span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                disabled={disabled}
                className={cn(
                  'h-9 rounded-md border border-input bg-background px-2 text-sm',
                  'focus:outline-none focus:ring-1 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {MINUTES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hourly: minute selector */}
          {frequency === 'hourly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Run at minute
              </span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                disabled={disabled}
                className={cn(
                  'h-9 rounded-md border border-input bg-background px-2 text-sm',
                  'focus:outline-none focus:ring-1 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {MINUTES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">
                of every hour
              </span>
            </div>
          )}

          {/* Weekly: day selector */}
          {frequency === 'weekly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">on</span>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    title={day.label}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: day of month selector */}
          {frequency === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">on day</span>
              <select
                value={selectedDayOfMonth}
                onChange={(e) => setSelectedDayOfMonth(e.target.value)}
                disabled={disabled}
                className={cn(
                  'h-9 rounded-md border border-input bg-background px-2 text-sm',
                  'focus:outline-none focus:ring-1 focus:ring-ring',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {DAYS_OF_MONTH.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">
                of the month
              </span>
            </div>
          )}
        </div>
      )}

      {/* Custom cron input */}
      {frequency === 'custom' && (
        <div className="space-y-2">
          <input
            type="text"
            value={customExpression}
            onChange={(e) => setCustomExpression(e.target.value)}
            disabled={disabled}
            placeholder="* * * * *"
            className={cn(
              'h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />
          <p className="text-xs text-muted-foreground">
            Format: minute hour day-of-month month day-of-week
          </p>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="rounded-md bg-muted/50 p-3">
          <div className="mb-1 font-mono text-sm">{value}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      )}
    </div>
  );
}

CronExpressionInput.displayName = 'CronExpressionInput';
