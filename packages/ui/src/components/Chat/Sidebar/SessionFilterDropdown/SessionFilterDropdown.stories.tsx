import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  SessionFilterDropdown,
  type SessionFilter,
} from './SessionFilterDropdown';

const meta: Meta<typeof SessionFilterDropdown> = {
  title: 'Chat/Sidebar/SessionFilterDropdown',
  component: SessionFilterDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['my_chats', 'all', 'sub_agents'],
      description: 'Current filter value',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[200px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionFilterDropdown>;

export const Default: Story = {
  args: {
    value: 'my_chats',
    onChange: (filter) => console.log('Filter changed to:', filter),
  },
};

export const AllSessions: Story = {
  args: {
    value: 'all',
    onChange: (filter) => console.log('Filter changed to:', filter),
  },
};

export const SubAgentsOnly: Story = {
  args: {
    value: 'sub_agents',
    onChange: (filter) => console.log('Filter changed to:', filter),
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [filter, setFilter] = useState<SessionFilter>('my_chats');

    return (
      <div className="space-y-4">
        <SessionFilterDropdown value={filter} onChange={setFilter} />
        <p className="text-sm text-muted-foreground">
          Selected: <strong>{filter}</strong>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with state management.',
      },
    },
  },
};
