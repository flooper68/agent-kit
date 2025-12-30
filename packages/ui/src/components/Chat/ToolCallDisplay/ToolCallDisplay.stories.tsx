import type { Meta, StoryObj } from '@storybook/react';
import { ToolCallDisplay } from './ToolCallDisplay';

const meta: Meta<typeof ToolCallDisplay> = {
  title: 'Chat/AI Features/ToolCallDisplay',
  component: ToolCallDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolCallDisplay>;

export const Pending: Story = {
  args: {
    invocation: {
      id: '1',
      type: 'tool_invocation',
      toolName: 'search_web',
      toolCallId: 'call_123',
      args: { query: 'React hooks tutorial' },
      state: 'pending',
    },
  },
};

export const Running: Story = {
  args: {
    invocation: {
      id: '1',
      type: 'tool_invocation',
      toolName: 'execute_code',
      toolCallId: 'call_456',
      args: { language: 'python', code: 'print("Hello World")' },
      state: 'running',
    },
  },
};

export const Completed: Story = {
  args: {
    invocation: {
      id: '1',
      type: 'tool_invocation',
      toolName: 'search_web',
      toolCallId: 'call_123',
      args: { query: 'React hooks tutorial' },
      state: 'completed',
    },
    result: {
      id: '2',
      type: 'tool_result',
      toolCallId: 'call_123',
      result: 'Found 10 relevant results for React hooks tutorials.',
    },
  },
};

export const Error: Story = {
  args: {
    invocation: {
      id: '1',
      type: 'tool_invocation',
      toolName: 'fetch_url',
      toolCallId: 'call_789',
      args: { url: 'https://example.com/api' },
      state: 'error',
    },
    result: {
      id: '2',
      type: 'tool_result',
      toolCallId: 'call_789',
      result: 'Connection timeout after 30 seconds',
      isError: true,
    },
  },
};

export const ExpandedByDefault: Story = {
  args: {
    defaultExpanded: true,
    invocation: {
      id: '1',
      type: 'tool_invocation',
      toolName: 'read_file',
      toolCallId: 'call_abc',
      args: { path: '/src/components/Button.tsx' },
      state: 'completed',
    },
    result: {
      id: '2',
      type: 'tool_result',
      toolCallId: 'call_abc',
      result:
        'export const Button = ({ children }) => <button>{children}</button>;',
    },
  },
};
