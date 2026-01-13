import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ApprovalPanel } from './ApprovalPanel';

const meta: Meta<typeof ApprovalPanel> = {
  title: 'Chat/Chat Components/ApprovalPanel',
  component: ApprovalPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ApprovalPanel is a banner component for approval flows in the agent panel.
It displays a message with Approve/Deny buttons, positioned above the chat input.

## Features
- Customizable title/message
- Customizable button labels
- Loading state support
- Info color theme (blue)
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Title/message displayed in the panel',
    },
    approveLabel: {
      control: 'text',
      description: 'Custom label for the approve button',
    },
    denyLabel: {
      control: 'text',
      description: 'Custom label for the deny button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the approve action is loading',
    },
    onApprove: { action: 'approved' },
    onDeny: { action: 'denied' },
  },
};

export default meta;
type Story = StoryObj<typeof ApprovalPanel>;

export const Default: Story = {
  args: {
    title: "Ok, here's my plan:",
    approveLabel: 'Approve',
    denyLabel: 'Reject',
  },
};

export const Loading: Story = {
  args: {
    title: 'Executing plan...',
    isLoading: true,
  },
};

export const CustomLabels: Story = {
  args: {
    title: 'Ready to proceed with the search?',
    approveLabel: 'Yes, proceed',
    denyLabel: 'Cancel',
  },
};

export const LongMessage: Story = {
  args: {
    title:
      'I will search for recent articles, analyze key insights, and compile a summary with sources.',
    approveLabel: 'Start',
    denyLabel: 'Cancel',
  },
};

// Interactive demo with state
const InteractiveDemo = () => {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'approved' | 'denied'
  >('idle');

  const handleApprove = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('approved');
    }, 1500);
  };

  const handleDeny = () => {
    setStatus('denied');
  };

  const handleReset = () => {
    setStatus('idle');
  };

  if (status === 'approved') {
    return (
      <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-sm">
        <p className="font-medium text-success">Plan approved!</p>
        <p className="text-muted-foreground mt-1">Execution started.</p>
        <button
          onClick={handleReset}
          className="mt-3 text-xs text-primary underline"
        >
          Reset demo
        </button>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
        <p className="font-medium text-destructive">Plan rejected</p>
        <p className="text-muted-foreground mt-1">The plan was not executed.</p>
        <button
          onClick={handleReset}
          className="mt-3 text-xs text-primary underline"
        >
          Reset demo
        </button>
      </div>
    );
  }

  return (
    <ApprovalPanel
      title="Ok, here's my plan:"
      onApprove={handleApprove}
      onDeny={handleDeny}
      approveLabel="Approve Plan & Start"
      denyLabel="Reject"
      isLoading={status === 'loading'}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo showing the approval flow:
1. Click "Approve Plan & Start" to simulate approval (with loading state)
2. Click "Reject" to cancel
        `,
      },
    },
  },
};

// Above chat input positioning demo
export const AboveChatInput: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto bg-background border rounded-lg overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <span className="font-medium">Copilot</span>
      </div>

      {/* Chat content area */}
      <div className="h-64 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-end">
          <div className="bg-muted px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">
            <p className="text-sm">Research founder mode</p>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="text-sm space-y-2">
            <p>
              I will help you research founder mode. Let me outline my approach:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Search for recent articles and discussions</li>
              <li>Gather key insights and definitions</li>
              <li>Compile a summary with sources</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Approval panel above input */}
      <div className="px-4 pb-2">
        <ApprovalPanel
          title="Ok, here's my plan:"
          onApprove={() => console.log('approved')}
          onDeny={() => console.log('denied')}
          approveLabel="Approve Plan & Start"
        />
      </div>

      {/* Chat input */}
      <div className="p-4 pt-2 border-t">
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm outline-none"
            disabled
          />
          <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md">
            Send
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the ApprovalPanel appears positioned above the chat input.',
      },
    },
  },
};
