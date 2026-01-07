import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { RunningTimeIndicator } from './RunningTimeIndicator';

const meta: Meta<typeof RunningTimeIndicator> = {
  title: 'Chat/Chat Components/RunningTimeIndicator',
  component: RunningTimeIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof RunningTimeIndicator>;

// Helper to format duration (same as app layer)
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Hook for storybook demos (simulates app layer behavior)
function useElapsedLabel(
  isRunning: boolean,
  initialSeconds = 0
): string | null {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [finalLabel, setFinalLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isRunning) {
      setFinalLabel(null);
      const interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (seconds > 0) {
      setFinalLabel(formatDuration(seconds));
    }
  }, [isRunning, seconds]);

  if (finalLabel) return finalLabel;
  if (seconds === 0 && !isRunning) return null;
  return formatDuration(seconds);
}

// Interactive streaming story that updates in real-time
const StreamingDemo = () => {
  const elapsedLabel = useElapsedLabel(true, 0);
  return (
    <RunningTimeIndicator status="streaming" elapsedLabel={elapsedLabel} />
  );
};

export const Streaming: Story = {
  render: () => <StreamingDemo />,
};

// Streaming for longer duration (simulated at 65 seconds)
const StreamingLongDemo = () => {
  const elapsedLabel = useElapsedLabel(true, 65);
  return (
    <RunningTimeIndicator status="streaming" elapsedLabel={elapsedLabel} />
  );
};

export const StreamingLong: Story = {
  render: () => <StreamingLongDemo />,
};

// Completed state
export const Completed: Story = {
  args: {
    status: 'ready',
    elapsedLabel: '5s',
  },
};

// Completed with longer duration
export const CompletedLong: Story = {
  args: {
    status: 'ready',
    elapsedLabel: '2m 5s',
  },
};

// No time - renders nothing
export const NoTime: Story = {
  args: {
    status: 'ready',
    elapsedLabel: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'When elapsedLabel is null, renders nothing.',
      },
    },
  },
};

// Submitted - renders nothing
export const Submitted: Story = {
  args: {
    status: 'submitted',
    elapsedLabel: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When status is submitted (before streaming starts), typically no elapsed label.',
      },
    },
  },
};

// Full lifecycle demo
const FullLifecycleDemo = () => {
  const [status, setStatus] = useState<
    'ready' | 'submitted' | 'streaming' | 'error' | 'loading'
  >('ready');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finalLabel, setFinalLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isRunning) {
      setFinalLabel(null);
      const interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (seconds > 0) {
      setFinalLabel(formatDuration(seconds));
    }
  }, [isRunning, seconds]);

  const elapsedLabel =
    finalLabel ?? (seconds > 0 ? formatDuration(seconds) : null);

  const handleStart = () => {
    setStatus('submitted');
    setSeconds(0);
    setTimeout(() => {
      setStatus('streaming');
      setIsRunning(true);
    }, 500);
  };

  const handleStop = () => {
    setStatus('ready');
    setIsRunning(false);
  };

  const handleReset = () => {
    setStatus('ready');
    setIsRunning(false);
    setSeconds(0);
    setFinalLabel(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={status === 'streaming'}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={status !== 'streaming'}
          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
        >
          Reset
        </button>
      </div>
      <div className="min-h-[24px]">
        <RunningTimeIndicator status={status} elapsedLabel={elapsedLabel} />
      </div>
      <div className="text-xs text-muted-foreground">Status: {status}</div>
    </div>
  );
};

export const FullLifecycle: Story = {
  render: () => <FullLifecycleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing the full lifecycle: ready -> submitted -> streaming -> ready',
      },
    },
  },
};
