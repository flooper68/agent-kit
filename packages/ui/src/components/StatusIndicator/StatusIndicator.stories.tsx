import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from './StatusIndicator';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Primitives/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A visual indicator showing connection or processing status. Commonly used in headers to show system state.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'loading', 'error'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    animate: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusIndicator>;

export const Connected: Story = {
  args: {
    status: 'connected',
    label: 'Connected',
  },
};

export const Disconnected: Story = {
  args: {
    status: 'disconnected',
    label: 'Disconnected',
  },
};

export const Loading: Story = {
  args: {
    status: 'loading',
    label: 'Loading...',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    label: 'Connection failed',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatusIndicator status="connected" label="Connected" />
      <StatusIndicator status="disconnected" label="Disconnected" />
      <StatusIndicator status="loading" label="Loading..." />
      <StatusIndicator status="error" label="Connection failed" />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {
    status: 'connected',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Status indicator can be used without a label for compact displays.',
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    status: 'connected',
    label: 'Connected',
    size: 'sm',
  },
};

export const NoAnimation: Story = {
  args: {
    status: 'connected',
    label: 'Connected',
    animate: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Animation can be disabled for static displays.',
      },
    },
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <span className="font-medium">My Application</span>
      <StatusIndicator status="connected" label="Online" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of StatusIndicator used in a header context.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <StatusIndicator status="connected" label="Small" size="sm" />
      <StatusIndicator status="connected" label="Medium" size="md" />
    </div>
  ),
};
