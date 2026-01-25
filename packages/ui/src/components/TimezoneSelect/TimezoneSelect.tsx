import { useState, useMemo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

// Common timezones grouped by region
const TIMEZONE_GROUPS = {
  Americas: [
    { value: 'America/New_York', label: 'New York (ET)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Chicago (CT)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Denver (MT)', offset: '-07:00' },
    {
      value: 'America/Los_Angeles',
      label: 'Los Angeles (PT)',
      offset: '-08:00',
    },
    { value: 'America/Anchorage', label: 'Anchorage (AKT)', offset: '-09:00' },
    { value: 'America/Toronto', label: 'Toronto (ET)', offset: '-05:00' },
    { value: 'America/Vancouver', label: 'Vancouver (PT)', offset: '-08:00' },
    { value: 'America/Sao_Paulo', label: 'Sao Paulo', offset: '-03:00' },
    {
      value: 'America/Mexico_City',
      label: 'Mexico City (CT)',
      offset: '-06:00',
    },
  ],
  Europe: [
    { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', offset: '+01:00' },
    { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: '+01:00' },
    { value: 'Europe/Rome', label: 'Rome (CET)', offset: '+01:00' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', offset: '+03:00' },
  ],
  'Asia & Pacific': [
    { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
    { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)', offset: '+05:30' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+09:00' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
    {
      value: 'Australia/Melbourne',
      label: 'Melbourne (AEST)',
      offset: '+10:00',
    },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: '+12:00' },
  ],
  Universal: [
    {
      value: 'UTC',
      label: 'UTC (Coordinated Universal Time)',
      offset: '+00:00',
    },
  ],
};

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

  // Flatten and filter timezones based on search
  const filteredGroups = useMemo(() => {
    const searchLower = search.toLowerCase();
    const result: Record<string, typeof TIMEZONE_GROUPS.Americas> = {};

    for (const [group, timezones] of Object.entries(TIMEZONE_GROUPS)) {
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
  }, [search]);

  // Get the label for the selected value
  const selectedLabel = useMemo(() => {
    for (const timezones of Object.values(TIMEZONE_GROUPS)) {
      const found = timezones.find((tz) => tz.value === value);
      if (found) return found.label;
    }
    return value || placeholder;
  }, [value, placeholder]);

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
