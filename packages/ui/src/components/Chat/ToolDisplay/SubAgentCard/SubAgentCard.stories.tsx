import type { Meta, StoryObj } from '@storybook/react';
import { SubAgentCard } from './SubAgentCard';

const meta: Meta<typeof SubAgentCard> = {
  title: 'Chat/Chat Components/SubAgentCard (Static)',
  component: SubAgentCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Static SubAgentCard for displaying spawn_agent tool calls. For real-time streaming content, use `AgentPanel` in compact mode with the `renderSubAgentCard` prop. See AgentPanel/Compact Mode stories for the streaming version.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['pending', 'running', 'complete', 'error'],
      description: 'Current status of the sub-agent',
    },
    agentName: {
      control: 'text',
      description: 'Name of the sub-agent',
    },
    sessionId: {
      control: 'text',
      description: 'Session ID (available after tool result)',
    },
    summary: {
      control: 'text',
      description: '1-2 line summary when complete',
    },
    latestAction: {
      control: 'text',
      description: 'Current action while running',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message when status is error',
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
type Story = StoryObj<typeof SubAgentCard>;

export const Pending: Story = {
  args: {
    agentName: 'researcher',
    status: 'pending',
  },
};

export const Running: Story = {
  args: {
    agentName: 'researcher',
    status: 'running',
    latestAction: 'Searching academic papers...',
  },
};

export const RunningLongText: Story = {
  args: {
    agentName: 'code-analyzer',
    status: 'running',
    latestAction:
      'Analyzing codebase structure, parsing AST nodes, extracting function signatures, and building dependency graph for comprehensive analysis...',
  },
};

export const Complete: Story = {
  args: {
    agentName: 'researcher',
    status: 'complete',
    sessionId: 'session-123',
    summary: 'Found 12 relevant papers on machine learning optimization.',
  },
};

export const CompleteWithLongSummary: Story = {
  args: {
    agentName: 'data-processor',
    status: 'complete',
    sessionId: 'session-456',
    summary:
      'Successfully processed 1,547 records from the database. Validated all entries against schema, corrected 23 formatting issues, and generated comprehensive report with statistical analysis.',
  },
};

export const Error: Story = {
  args: {
    agentName: 'api-caller',
    status: 'error',
    errorMessage:
      'Connection timeout after 30000ms. The remote server did not respond.',
    onRetry: () => console.log('Retry clicked'),
  },
};

export const Interactive: Story = {
  args: {
    agentName: 'researcher',
    status: 'complete',
    sessionId: 'session-789',
    summary: 'Analysis complete. Click to view full results.',
    onOpenFullView: () => console.log('Open full view clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click "Open Full View" to trigger the callback.',
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <SubAgentCard agentName="pending-agent" status="pending" />
      <SubAgentCard
        agentName="running-agent"
        status="running"
        latestAction="Processing data..."
      />
      <SubAgentCard
        agentName="complete-agent"
        status="complete"
        summary="Task finished successfully."
        onOpenFullView={() => console.log('Open full view')}
      />
      <SubAgentCard
        agentName="error-agent"
        status="error"
        errorMessage="Something went wrong."
        onRetry={() => console.log('Retry')}
        onOpenFullView={() => console.log('Open full view')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All status states displayed together for comparison.',
      },
    },
  },
};
