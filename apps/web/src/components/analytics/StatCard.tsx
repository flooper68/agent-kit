import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: number; // percentage change
  icon: LucideIcon;
  format?: 'number' | 'currency' | 'percentage';
}

export function StatCard({ label, value, trend, icon: Icon }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0)
      return <Minus className="h-3 w-3" />;
    return trend > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatTrend = () => {
    if (trend === undefined) return null;
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend}%`;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground text-sm">{label}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {trend !== undefined && (
          <span
            className={`text-sm flex items-center gap-1 ${getTrendColor()}`}
          >
            {getTrendIcon()}
            {formatTrend()}
          </span>
        )}
      </div>
    </div>
  );
}
