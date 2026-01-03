import { Select } from '@agent-kit/ui';

export type TimeRange = 'today' | 'week' | 'month' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const options = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRange)}
      options={options}
      className="w-40"
    />
  );
}
