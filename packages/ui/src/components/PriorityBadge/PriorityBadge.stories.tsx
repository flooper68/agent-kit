import type { Meta, StoryObj } from '@storybook/react';
import { PriorityBadge } from './PriorityBadge';

const meta: Meta<typeof PriorityBadge> = {
  title: 'Planning/PriorityBadge',
  component: PriorityBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A badge component that displays task priority with color-coded variants.',
      },
    },
  },
  argTypes: {
    priority: {
      control: 'select',
      options: ['low', 'medium', 'high', 'urgent'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PriorityBadge>;

export const AllPriorities: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <PriorityBadge priority="low" />
      <PriorityBadge priority="medium" />
      <PriorityBadge priority="high" />
      <PriorityBadge priority="urgent" />
    </div>
  ),
};

export const Low: Story = {
  args: {
    priority: 'low',
  },
};

export const Medium: Story = {
  args: {
    priority: 'medium',
  },
};

export const High: Story = {
  args: {
    priority: 'high',
  },
};

export const Urgent: Story = {
  args: {
    priority: 'urgent',
  },
};

export const WithCustomClass: Story = {
  args: {
    priority: 'high',
    className: 'text-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom className can be passed to modify the badge styling.',
      },
    },
  },
};
