import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBanner } from './ErrorBanner';

const meta: Meta<typeof ErrorBanner> = {
  title: 'Chat/ErrorBanner',
  component: ErrorBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Error message to display',
    },
    sticky: {
      control: 'boolean',
      description: 'Whether the banner sticks to the top',
    },
    onDismiss: { action: 'dismissed' },
    onRetry: { action: 'retried' },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBanner>;

export const Default: Story = {
  args: {
    message: 'Something went wrong. Please try again.',
    sticky: false,
  },
};

export const WithRetry: Story = {
  args: {
    message: 'Failed to send message. Check your connection.',
    onRetry: () => console.log('Retry clicked'),
    sticky: false,
  },
};

export const Dismissible: Story = {
  args: {
    message: 'An error occurred while processing your request.',
    onDismiss: () => console.log('Dismissed'),
    sticky: false,
  },
};

export const WithBothActions: Story = {
  args: {
    message: 'Connection lost. Your message was not sent.',
    onRetry: () => console.log('Retry clicked'),
    onDismiss: () => console.log('Dismissed'),
    sticky: false,
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'An unexpected error occurred while processing your request. The server returned a 500 Internal Server Error. Please try again later or contact support if the problem persists.',
    onRetry: () => console.log('Retry clicked'),
    onDismiss: () => console.log('Dismissed'),
    sticky: false,
  },
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-background border rounded-lg max-w-md">
      <ErrorBanner
        message="Failed to load messages."
        onRetry={() => console.log('Retry')}
        onDismiss={() => console.log('Dismiss')}
        sticky={false}
      />
      <div className="text-sm text-muted-foreground">
        This shows how the error banner appears in context with other content.
      </div>
    </div>
  ),
};
