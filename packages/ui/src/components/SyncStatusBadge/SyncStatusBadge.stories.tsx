import type { Meta, StoryObj } from '@storybook/react';
import { SyncStatusBadge } from './SyncStatusBadge';

const meta: Meta<typeof SyncStatusBadge> = {
  title: 'Integrations/SyncStatusBadge',
  component: SyncStatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A badge component that displays sync status with color-coded variants and animated icons.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['pending', 'syncing', 'synced', 'failed', 'error'],
    },
    showIcon: {
      control: 'boolean',
    },
    showLabel: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SyncStatusBadge>;

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <SyncStatusBadge status="pending" />
      <SyncStatusBadge status="syncing" />
      <SyncStatusBadge status="synced" />
      <SyncStatusBadge status="failed" />
      <SyncStatusBadge status="error" />
    </div>
  ),
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Syncing: Story = {
  args: {
    status: 'syncing',
  },
};

export const Synced: Story = {
  args: {
    status: 'synced',
  },
};

export const Failed: Story = {
  args: {
    status: 'failed',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
  },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <SyncStatusBadge status="pending" showLabel={false} />
      <SyncStatusBadge status="syncing" showLabel={false} />
      <SyncStatusBadge status="synced" showLabel={false} />
      <SyncStatusBadge status="failed" showLabel={false} />
      <SyncStatusBadge status="error" showLabel={false} />
    </div>
  ),
};

export const LabelOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <SyncStatusBadge status="pending" showIcon={false} />
      <SyncStatusBadge status="syncing" showIcon={false} />
      <SyncStatusBadge status="synced" showIcon={false} />
    </div>
  ),
};
