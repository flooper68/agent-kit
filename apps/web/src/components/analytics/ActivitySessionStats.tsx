import { Clock, Activity, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';

interface ActivitySessionStatsProps {
  totalSessions: number;
  averageDurationMinutes: number;
  sessionsPerDay: number;
  isLoading?: boolean;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function ActivitySessionStats({
  totalSessions,
  averageDurationMinutes,
  sessionsPerDay,
  isLoading,
}: ActivitySessionStatsProps) {
  const stats = [
    {
      label: 'Activity Sessions',
      value: isLoading ? '-' : formatNumber(totalSessions),
      icon: Activity,
    },
    {
      label: 'Avg Duration',
      value: isLoading ? '-' : formatDuration(averageDurationMinutes),
      icon: Clock,
    },
    {
      label: 'Sessions/Day',
      value: isLoading ? '-' : sessionsPerDay.toFixed(1),
      icon: Calendar,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
