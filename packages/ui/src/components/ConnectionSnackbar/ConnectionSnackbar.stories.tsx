import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ConnectionSnackbar,
  type ConnectionStatus,
} from './ConnectionSnackbar';

// Interactive demo component for AllStates story
function AllStatesDemo() {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="p-8">
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => {
            setStatus('connected');
            setAttempt(0);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Set Connected
        </button>
        <button
          onClick={() => setStatus('disconnected')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Set Disconnected
        </button>
        <button
          onClick={() => {
            setStatus('reconnecting');
            setAttempt((prev) => prev + 1);
          }}
          className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
        >
          Set Reconnecting
        </button>
      </div>
      <p className="text-muted-foreground mb-4">
        Current status: <strong>{status}</strong>
        {status === 'reconnecting' && ` (attempt ${attempt})`}
      </p>
      <ConnectionSnackbar status={status} reconnectAttempt={attempt} />
    </div>
  );
}

const meta: Meta<typeof ConnectionSnackbar> = {
  title: 'Primitives/ConnectionSnackbar',
  component: ConnectionSnackbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A subtle status indicator for displaying WebSocket connection state. Always visible for debugging.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'reconnecting'],
    },
    reconnectAttempt: {
      control: { type: 'number', min: 0, max: 10 },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[200px] relative">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectionSnackbar>;

export const Connected: Story = {
  args: {
    status: 'connected',
  },
};

export const Disconnected: Story = {
  args: {
    status: 'disconnected',
  },
};

export const Reconnecting: Story = {
  args: {
    status: 'reconnecting',
    reconnectAttempt: 3,
  },
};

export const ReconnectingFirstAttempt: Story = {
  args: {
    status: 'reconnecting',
    reconnectAttempt: 1,
  },
};

export const AllStates: Story = {
  render: () => <AllStatesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing all connection states. Click buttons to simulate state changes.',
      },
    },
  },
};
