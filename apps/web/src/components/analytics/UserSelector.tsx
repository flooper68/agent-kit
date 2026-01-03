import { Select } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import type { TimeRange } from './TimeRangeSelector';

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  timeRange: TimeRange;
}

// Radix Select doesn't allow empty string values, so we use a special value for "All Users"
const ALL_USERS_VALUE = '__all__';

function getUserDisplayName(user: {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): string {
  // Prefer full name, then email, then truncated userId
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  if (user.email) {
    return user.email;
  }
  // Fallback to truncated user ID
  return user.userId.length > 12
    ? user.userId.slice(0, 12) + '...'
    : user.userId;
}

export function UserSelector({
  value,
  onChange,
  timeRange,
}: UserSelectorProps) {
  const usersQuery = trpc.analytics.getUsersWithSessions.useQuery({
    timeRange,
  });

  const options = [
    { value: ALL_USERS_VALUE, label: 'All Users' },
    ...(usersQuery.data ?? []).map((user) => ({
      value: user.userId,
      label: `${getUserDisplayName(user)} (${user.sessionCount})`,
    })),
  ];

  // Convert between external value (empty string = all) and internal value (__all__ = all)
  const internalValue = value === '' ? ALL_USERS_VALUE : value;

  const handleChange = (e: { target: { value: string } }) => {
    const newValue = e.target.value === ALL_USERS_VALUE ? '' : e.target.value;
    onChange(newValue);
  };

  return (
    <Select
      value={internalValue}
      onChange={handleChange}
      options={options}
      className="w-48"
      disabled={usersQuery.isLoading}
    />
  );
}
