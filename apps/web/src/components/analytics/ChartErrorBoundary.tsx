import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Text } from '@agent-kit/ui';

interface Props {
  children: ReactNode;
  chartName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart rendering error:', {
      chartName: this.props.chartName,
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <Text className="font-medium text-destructive">
            {this.props.chartName
              ? `Failed to render ${this.props.chartName}`
              : 'Failed to render chart'}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page
          </Text>
        </div>
      );
    }

    return this.props.children;
  }
}
