import type { Meta, StoryObj } from '@storybook/react';
import { ToolBadge } from './ToolBadge';

const meta: Meta<typeof ToolBadge> = {
  title: 'Chat/ToolBadge',
  component: ToolBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['pending', 'running', 'completed', 'error'],
      description: 'Current state of the tool execution',
    },
    toolName: {
      control: 'text',
      description: 'Name of the tool being executed',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ToolBadge>;

export const Default: Story = {
  args: {
    toolName: 'read_file',
    state: 'completed',
  },
};

export const Pending: Story = {
  args: {
    toolName: 'search_codebase',
    state: 'pending',
  },
};

export const Running: Story = {
  args: {
    toolName: 'execute_command',
    state: 'running',
  },
};

export const Completed: Story = {
  args: {
    toolName: 'write_file',
    state: 'completed',
  },
};

export const Error: Story = {
  args: {
    toolName: 'api_request',
    state: 'error',
  },
};

export const Interactive: Story = {
  args: {
    toolName: 'read_file',
    state: 'completed',
    onClick: () => console.log('Badge clicked'),
  },
};

export const LongToolName: Story = {
  args: {
    toolName: 'execute_very_long_command_name_here',
    state: 'completed',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ToolBadge toolName="pending_task" state="pending" />
      <ToolBadge toolName="running_task" state="running" />
      <ToolBadge toolName="completed_task" state="completed" />
      <ToolBadge toolName="failed_task" state="error" />
    </div>
  ),
};
