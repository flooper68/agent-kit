import { useState, useMemo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Get the current UTC offset for a timezone using Intl.DateTimeFormat
 * Returns a formatted string like "+05:30" or "-08:00"
 */
function getTimezoneOffset(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    // Extract offset from "GMT+05:30" or "GMT-08:00" format
    const match = tzPart?.value.match(/GMT([+-]\d{2}:\d{2})/);
    if (match?.[1]) {
      return match[1];
    }
    // Handle UTC case (GMT with no offset)
    if (tzPart?.value === 'GMT') {
      return '+00:00';
    }
    return '+00:00';
  } catch {
    return '+00:00';
  }
}

// Common timezones grouped by region (IANA identifiers only)
const TIMEZONE_DATA = {
  Americas: [
    { value: 'America/New_York', label: 'New York (ET)' },
    { value: 'America/Chicago', label: 'Chicago (CT)' },
    { value: 'America/Denver', label: 'Denver (MT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
    { value: 'America/Anchorage', label: 'Anchorage (AKT)' },
    { value: 'America/Toronto', label: 'Toronto (ET)' },
    { value: 'America/Vancouver', label: 'Vancouver (PT)' },
    { value: 'America/Sao_Paulo', label: 'Sao Paulo' },
    { value: 'America/Mexico_City', label: 'Mexico City (CT)' },
  ],
  Europe: [
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
    { value: 'Europe/Madrid', label: 'Madrid (CET)' },
    { value: 'Europe/Rome', label: 'Rome (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  ],
  'Asia & Pacific': [
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  ],
  Universal: [{ value: 'UTC', label: 'UTC (Coordinated Universal Time)' }],
} as const;

type TimezoneEntry = { value: string; label: string; offset: string };
type TimezoneGroups = Record<string, TimezoneEntry[]>;

export interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TimezoneSelect({
  value,
  onChange,
  className,
  disabled,
  placeholder = 'Select timezone...',
}: TimezoneSelectProps) {
  const [search, setSearch] = useState('');

  // Build timezone groups with dynamic offsets
  const timezoneGroups = useMemo((): TimezoneGroups => {
    const result: TimezoneGroups = {};
    for (const [group, timezones] of Object.entries(TIMEZONE_DATA)) {
      result[group] = timezones.map((tz) => ({
        value: tz.value,
        label: tz.label,
        offset: getTimezoneOffset(tz.value),
      }));
    }
    return result;
  }, []);

  // Flatten and filter timezones based on search
  const filteredGroups = useMemo(() => {
    const searchLower = search.toLowerCase();
    const result: TimezoneGroups = {};

    for (const [group, timezones] of Object.entries(timezoneGroups)) {
      const filtered = timezones.filter(
        (tz) =>
          tz.label.toLowerCase().includes(searchLower) ||
          tz.value.toLowerCase().includes(searchLower)
      );
      if (filtered.length > 0) {
        result[group] = filtered;
      }
    }

    return result;
  }, [search, timezoneGroups]);

  // Get the label for the selected value
  const selectedLabel = useMemo(() => {
    for (const timezones of Object.values(timezoneGroups)) {
      const found = timezones.find((tz) => tz.value === value);
      if (found) return found.label;
    }
    return value || placeholder;
  }, [value, placeholder, timezoneGroups]);

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'transition-colors duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-1 focus:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          '[&>span]:line-clamp-1',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedLabel}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-96 min-w-[280px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          position="popper"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search timezones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <SelectPrimitive.Viewport className="max-h-[280px] overflow-auto p-1">
            {Object.entries(filteredGroups).map(([group, timezones]) => (
              <SelectPrimitive.Group key={group}>
                <SelectPrimitive.Label className="px-6 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group}
                </SelectPrimitive.Label>
                {timezones.map((tz) => (
                  <SelectPrimitive.Item
                    key={tz.value}
                    value={tz.value}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                      'transition-colors duration-150',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground'
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      <span className="flex items-center justify-between gap-4">
                        <span>{tz.label}</span>
                        <span className="text-xs text-muted-foreground">
                          UTC{tz.offset}
                        </span>
                      </span>
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            ))}
            {Object.keys(filteredGroups).length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No timezones found
              </div>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

TimezoneSelect.displayName = 'TimezoneSelect';
