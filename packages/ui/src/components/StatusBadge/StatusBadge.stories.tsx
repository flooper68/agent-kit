import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Planning/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A badge component that displays task status with color-coded variants.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['todo', 'in_progress', 'review', 'done'],
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <StatusBadge status="todo" />
      <StatusBadge status="in_progress" />
      <StatusBadge status="review" />
      <StatusBadge status="done" />
    </div>
  ),
};

export const Todo: Story = {
  args: {
    status: 'todo',
  },
};

export const InProgress: Story = {
  args: {
    status: 'in_progress',
  },
};

export const Review: Story = {
  args: {
    status: 'review',
  },
};

export const Done: Story = {
  args: {
    status: 'done',
  },
};

export const DoneWithoutIcon: Story = {
  args: {
    status: 'done',
    showIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'The checkmark icon can be hidden for the done status.',
      },
    },
  },
};
