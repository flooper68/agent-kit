import { Heading, Text } from '@agent-kit/ui';
import { AlertTriangle, CheckCircle, XCircle, Percent } from 'lucide-react';

interface ToolCallErrorStats {
  totalToolCalls: number;
  errorCount: number;
  errorRatePercentage: number;
}

interface ToolCallErrorsChartProps {
  data: ToolCallErrorStats | undefined;
  isLoading?: boolean;
}

export function ToolCallErrorsChart({
  data,
  isLoading,
}: ToolCallErrorsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Call Errors
          </Heading>
        </div>
        <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
          <Text className="text-muted-foreground">Loading...</Text>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <Heading as="h3" size="16">
            Tool Call Errors
          </Heading>
        </div>
        <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
          <Text className="text-muted-foreground">No data available</Text>
        </div>
      </div>
    );
  }

  const successCount = data.totalToolCalls - data.errorCount;
  const successRate = 100 - data.errorRatePercentage;

  // Determine status color based on error rate
  const getStatusColor = () => {
    if (data.errorRatePercentage === 0) return 'text-emerald-500';
    if (data.errorRatePercentage < 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBgColor = () => {
    if (data.errorRatePercentage === 0) return 'bg-emerald-500';
    if (data.errorRatePercentage < 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        <Heading as="h3" size="16">
          Tool Call Errors
        </Heading>
      </div>

      <div className="space-y-4">
        {/* Error rate progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {successRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getStatusBgColor()}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-lg font-semibold text-emerald-500">
              {successCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex justify-center mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-lg font-semibold text-red-500">
              {data.errorCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex justify-center mb-1">
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-lg font-semibold ${getStatusColor()}`}>
              {data.errorRatePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
