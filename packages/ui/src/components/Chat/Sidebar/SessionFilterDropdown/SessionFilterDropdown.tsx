import { memo } from 'react';
import { Select, type SelectOption } from '../../../Select';

export type SessionFilter = 'my_chats' | 'all' | 'sub_agents' | 'scheduled';

export interface SessionFilterDropdownProps {
  /** Current filter value */
  value: SessionFilter;
  /** Callback when filter changes */
  onChange: (filter: SessionFilter) => void;
  /** Optional className for the container */
  className?: string;
}

const filterOptions: SelectOption[] = [
  { value: 'my_chats', label: 'My Chats' },
  { value: 'all', label: 'All Sessions' },
  { value: 'sub_agents', label: 'Sub-agents Only' },
  { value: 'scheduled', label: 'Scheduled' },
];

/**
 * Custom comparison function for SessionFilterDropdown memoization
 */
function areSessionFilterDropdownPropsEqual(
  prev: SessionFilterDropdownProps,
  next: SessionFilterDropdownProps
): boolean {
  return prev.value === next.value && prev.onChange === next.onChange;
}

export const SessionFilterDropdown = memo(function SessionFilterDropdown({
  value,
  onChange,
  className,
}: SessionFilterDropdownProps) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => onChange(newValue as SessionFilter)}
      options={filterOptions}
      className={className}
    />
  );
}, areSessionFilterDropdownPropsEqual);
