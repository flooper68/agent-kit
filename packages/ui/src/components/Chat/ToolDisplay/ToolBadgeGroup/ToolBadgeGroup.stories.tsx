import type { Meta, StoryObj } from '@storybook/react';
import { ToolBadgeGroup } from './ToolBadgeGroup';
import type { ToolInvocationPart } from '../../../../types/chat';

const createToolInvocation = (
  toolName: string,
  state: ToolInvocationPart['state'],
  index: number
): ToolInvocationPart => ({
  type: 'tool_invocation',
  id: `inv-${index}`,
  toolCallId: `tool-${index}`,
  toolName,
  args: {},
  state,
});

const meta: Meta<typeof ToolBadgeGroup> = {
  title: 'Chat/ToolBadgeGroup',
  component: ToolBadgeGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    maxVisible: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of badges to show before collapsing',
    },
    onToolClick: { action: 'toolClicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ToolBadgeGroup>;

export const Default: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('read_file', 'completed', 1) },
      { invocation: createToolInvocation('write_file', 'completed', 2) },
    ],
    maxVisible: 2,
  },
};

export const FewTools: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('search', 'completed', 1) },
      { invocation: createToolInvocation('read_file', 'running', 2) },
    ],
    maxVisible: 2,
  },
};

export const ManyTools: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('search_codebase', 'completed', 1) },
      { invocation: createToolInvocation('read_file', 'completed', 2) },
      { invocation: createToolInvocation('write_file', 'completed', 3) },
      { invocation: createToolInvocation('execute_command', 'completed', 4) },
      { invocation: createToolInvocation('list_files', 'completed', 5) },
    ],
    maxVisible: 2,
  },
};

export const WithErrors: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('read_file', 'completed', 1) },
      { invocation: createToolInvocation('api_request', 'error', 2) },
      { invocation: createToolInvocation('write_file', 'error', 3) },
      { invocation: createToolInvocation('execute_cmd', 'completed', 4) },
    ],
    maxVisible: 2,
  },
};

export const AllRunning: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('search', 'running', 1) },
      { invocation: createToolInvocation('analyze', 'running', 2) },
      { invocation: createToolInvocation('process', 'pending', 3) },
    ],
    maxVisible: 2,
  },
};

export const SingleTool: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('single_tool', 'completed', 1) },
    ],
    maxVisible: 2,
  },
};

export const Interactive: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('read_file', 'completed', 1) },
      { invocation: createToolInvocation('write_file', 'completed', 2) },
      { invocation: createToolInvocation('execute', 'error', 3) },
    ],
    maxVisible: 2,
    onToolClick: (toolCallId) => console.log('Clicked:', toolCallId),
  },
};

export const ExpandedState: Story = {
  args: {
    tools: [
      { invocation: createToolInvocation('tool_1', 'completed', 1) },
      { invocation: createToolInvocation('tool_2', 'completed', 2) },
      { invocation: createToolInvocation('tool_3', 'completed', 3) },
      { invocation: createToolInvocation('tool_4', 'error', 4) },
      { invocation: createToolInvocation('tool_5', 'completed', 5) },
    ],
    maxVisible: 2,
  },
  render: (args) => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Collapsed:</p>
        <ToolBadgeGroup {...args} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Click &quot;+3 more&quot; to expand
        </p>
      </div>
    </div>
  ),
};
