import type { Meta, StoryObj } from '@storybook/react';
import { OAuthConnectButton } from './OAuthConnectButton';

const meta: Meta<typeof OAuthConnectButton> = {
  title: 'Integrations/OAuthConnectButton',
  component: OAuthConnectButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A button component for OAuth connection flow, supporting connect, disconnect, and loading states.',
      },
    },
  },
  argTypes: {
    isConnected: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    provider: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OAuthConnectButton>;

export const Disconnected: Story = {
  args: {
    provider: 'Google Drive',
    isConnected: false,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

export const Connected: Story = {
  args: {
    provider: 'Google Drive',
    isConnected: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

export const Loading: Story = {
  args: {
    provider: 'Google Drive',
    isConnected: false,
    isLoading: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

export const Disabled: Story = {
  args: {
    provider: 'Google Drive',
    isConnected: false,
    disabled: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

export const DisabledConnected: Story = {
  args: {
    provider: 'Google Drive',
    isConnected: true,
    disabled: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

const GoogleDriveIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.71 3.5L1.15 15l3.43 5.97 6.56-11.47L7.71 3.5zM22.85 15L16.29 3.5h-6.86l6.57 11.5h6.85zM8 17.32L4.58 23.5h13.72L21.72 17.32H8z" />
  </svg>
);

export const WithCustomIcon: Story = {
  args: {
    provider: 'Google Drive',
    providerIcon: <GoogleDriveIcon />,
    isConnected: false,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <OAuthConnectButton
        provider="Google Drive"
        isConnected={false}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
      <OAuthConnectButton
        provider="Google Drive"
        isConnected={true}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
      <OAuthConnectButton
        provider="Google Drive"
        isConnected={false}
        isLoading
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
      <OAuthConnectButton
        provider="Google Drive"
        isConnected={false}
        disabled
        onConnect={() => {}}
        onDisconnect={() => {}}
      />
    </div>
  ),
};
