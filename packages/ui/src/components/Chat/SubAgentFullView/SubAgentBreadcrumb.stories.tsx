import type { Meta, StoryObj } from '@storybook/react';
import { SubAgentBreadcrumb } from './SubAgentBreadcrumb';

const meta: Meta<typeof SubAgentBreadcrumb> = {
  title: 'Chat/Chat Components/SubAgentBreadcrumb',
  component: SubAgentBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    maxVisibleItems: {
      control: { type: 'number', min: 2, max: 10 },
      description: 'Maximum visible items before truncation',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px] p-4 bg-background border rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SubAgentBreadcrumb>;

export const SingleItem: Story = {
  args: {
    items: [{ sessionId: 'root', title: 'Main Chat' }],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single item - the current session. No navigation possible.',
      },
    },
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
    ],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
};

export const ThreeItems: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
      { sessionId: 'agent-2', title: 'detail_extractor' },
    ],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
};

export const FourItems: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
      { sessionId: 'agent-2', title: 'detail_extractor' },
      { sessionId: 'agent-3', title: 'summarizer' },
    ],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
      { sessionId: 'agent-2', title: 'detail_extractor' },
      { sessionId: 'agent-3', title: 'analyzer' },
      { sessionId: 'agent-4', title: 'validator' },
      { sessionId: 'agent-5', title: 'summarizer' },
    ],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
  parameters: {
    docs: {
      description: {
        story:
          '6 items with middle truncation. Click "..." to expand and see all items.',
      },
    },
  },
};

export const LongTitles: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Conversation Session' },
      {
        sessionId: 'agent-1',
        title: 'academic_paper_researcher_agent',
      },
      {
        sessionId: 'agent-2',
        title: 'detailed_content_extractor_and_analyzer',
      },
    ],
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long titles are truncated with ellipsis. Hover to see full title.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
      { sessionId: 'agent-2', title: 'detail_extractor' },
    ],
    onNavigate: (sessionId) => alert(`Navigating to session: ${sessionId}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click any breadcrumb item (except the last one) to trigger navigation.',
      },
    },
  },
};

export const CustomMaxVisible: Story = {
  args: {
    items: [
      { sessionId: 'root', title: 'Main Chat' },
      { sessionId: 'agent-1', title: 'researcher' },
      { sessionId: 'agent-2', title: 'detail_extractor' },
      { sessionId: 'agent-3', title: 'analyzer' },
      { sessionId: 'agent-4', title: 'summarizer' },
    ],
    maxVisibleItems: 3,
    onNavigate: (sessionId) => console.log('Navigate to:', sessionId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom maxVisibleItems set to 3. More items are truncated.',
      },
    },
  },
};
