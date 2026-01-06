import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
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

// Interactive streaming story that updates in real-time
const StreamingDemo = () => {
  const [startTime] = useState(() => Date.now());

  return (
    <RunningTimeIndicator status="streaming" streamingStartTime={startTime} />
  );
};

export const Streaming: Story = {
  render: () => <StreamingDemo />,
};

// Streaming for longer duration (simulated at 65 seconds)
const StreamingLongDemo = () => {
  const [startTime] = useState(() => Date.now() - 65000); // Started 65 seconds ago

  return (
    <RunningTimeIndicator status="streaming" streamingStartTime={startTime} />
  );
};

export const StreamingLong: Story = {
  render: () => <StreamingLongDemo />,
};

// Completed state
const CompletedDemo = () => {
  const [startTime] = useState(() => Date.now() - 5000);
  const [status, setStatus] = useState<'streaming' | 'ready'>('streaming');

  useEffect(() => {
    // Simulate streaming for 1 second then complete
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RunningTimeIndicator status={status} streamingStartTime={startTime} />
  );
};

export const Completed: Story = {
  render: () => <CompletedDemo />,
};

// Completed with longer duration
const CompletedLongDemo = () => {
  const [startTime] = useState(() => Date.now() - 125000); // 2m 5s ago
  const [status, setStatus] = useState<'streaming' | 'ready'>('streaming');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RunningTimeIndicator status={status} streamingStartTime={startTime} />
  );
};

export const CompletedLong: Story = {
  render: () => <CompletedLongDemo />,
};

// No time - renders nothing
export const NoTime: Story = {
  args: {
    status: 'ready',
    streamingStartTime: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'When status is ready and no start time, renders nothing.',
      },
    },
  },
};

// Submitted - renders nothing
export const Submitted: Story = {
  args: {
    status: 'submitted',
    streamingStartTime: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When status is submitted (before streaming starts), renders nothing.',
      },
    },
  },
};

// Full lifecycle demo
const FullLifecycleDemo = () => {
  const [status, setStatus] = useState<
    'ready' | 'submitted' | 'streaming' | 'error' | 'loading'
  >('ready');
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleStart = () => {
    setStatus('submitted');
    setTimeout(() => {
      setStartTime(Date.now());
      setStatus('streaming');
    }, 500);
  };

  const handleStop = () => {
    setStatus('ready');
  };

  const handleReset = () => {
    setStatus('ready');
    setStartTime(null);
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
        <RunningTimeIndicator status={status} streamingStartTime={startTime} />
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
