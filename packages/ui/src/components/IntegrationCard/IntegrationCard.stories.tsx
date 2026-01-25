import type { Meta, StoryObj } from '@storybook/react';
import { Cloud, HardDrive } from 'lucide-react';
import { IntegrationCard } from './IntegrationCard';
import { Button } from '../Button';

const meta: Meta<typeof IntegrationCard> = {
  title: 'Integrations/IntegrationCard',
  component: IntegrationCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card component for displaying integration status with icon, title, description, and action area.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['disconnected', 'connected', 'error'],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IntegrationCard>;

export const Disconnected: Story = {
  args: {
    title: 'Google Drive',
    description: 'Sync your artifacts to Google Drive',
    icon: <HardDrive className="h-5 w-5 text-muted-foreground" />,
    status: 'disconnected',
    children: (
      <Button variant="primary" size="sm">
        Connect
      </Button>
    ),
  },
};

export const Connected: Story = {
  args: {
    title: 'Google Drive',
    description: 'Sync your artifacts to Google Drive',
    icon: <HardDrive className="h-5 w-5 text-muted-foreground" />,
    status: 'connected',
    children: (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sync folder:</span>
          <span className="font-medium">My Artifacts</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Change Folder
          </Button>
          <Button variant="ghost" size="sm">
            Disconnect
          </Button>
        </div>
      </div>
    ),
  },
};

export const Error: Story = {
  args: {
    title: 'Google Drive',
    description: 'Sync your artifacts to Google Drive',
    icon: <HardDrive className="h-5 w-5 text-muted-foreground" />,
    status: 'error',
    statusLabel: 'Auth Failed',
    children: (
      <div className="space-y-2">
        <p className="text-sm text-red-600 dark:text-red-400">
          Authentication failed. Please reconnect.
        </p>
        <Button variant="primary" size="sm">
          Reconnect
        </Button>
      </div>
    ),
  },
};

export const WithCustomStatusLabel: Story = {
  args: {
    title: 'Cloud Storage',
    description: 'Backup your data to the cloud',
    icon: <Cloud className="h-5 w-5 text-muted-foreground" />,
    status: 'connected',
    statusLabel: 'Active',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'External Service',
    description: 'Connect to an external service',
    status: 'disconnected',
    children: (
      <Button variant="primary" size="sm">
        Configure
      </Button>
    ),
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <IntegrationCard
        title="Disconnected Integration"
        description="This integration is not connected"
        icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
        status="disconnected"
      />
      <IntegrationCard
        title="Connected Integration"
        description="This integration is active"
        icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
        status="connected"
      />
      <IntegrationCard
        title="Error Integration"
        description="This integration has an error"
        icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
        status="error"
      />
    </div>
  ),
};
