import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ToolDetailDialog } from './ToolDetailDialog';
import { Button } from '../../Button';
import type { ToolInvocationPart, ToolResultPart } from '../../../types/chat';

const createInvocation = (
  toolName: string,
  state: ToolInvocationPart['state'],
  args: Record<string, unknown> = {}
): ToolInvocationPart => ({
  type: 'tool_invocation',
  id: 'inv-1',
  toolCallId: 'tool-1',
  toolName,
  args,
  state,
});

const createResult = (result: unknown, isError = false): ToolResultPart => ({
  type: 'tool_result',
  id: 'res-1',
  toolCallId: 'tool-1',
  result,
  isError,
});

const meta: Meta<typeof ToolDetailDialog> = {
  title: 'Chat/ToolDetailDialog',
  component: ToolDetailDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ToolDetailDialog>;

// Interactive wrapper for stories
const DialogWrapper = ({
  invocation,
  result,
}: {
  invocation: ToolInvocationPart;
  result?: ToolResultPart;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>View Tool Details</Button>
      <ToolDetailDialog
        open={open}
        onOpenChange={setOpen}
        invocation={invocation}
        result={result}
      />
    </>
  );
};

export const Default: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('read_file', 'completed', {
        path: '/src/components/Button.tsx',
      })}
      result={createResult(
        'export const Button = () => {\n  return <button>Click me</button>;\n};'
      )}
    />
  ),
};

export const WithComplexOutput: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('search_codebase', 'completed', {
        query: 'useState',
        filePattern: '*.tsx',
        maxResults: 10,
      })}
      result={createResult({
        matches: [
          {
            file: 'src/App.tsx',
            line: 5,
            content: 'const [count, setCount] = useState(0)',
          },
          {
            file: 'src/hooks/useAuth.ts',
            line: 12,
            content: 'const [user, setUser] = useState(null)',
          },
          {
            file: 'src/components/Form.tsx',
            line: 8,
            content: 'const [value, setValue] = useState("")',
          },
        ],
        totalMatches: 3,
      })}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('api_request', 'error', {
        url: 'https://api.example.com/data',
        method: 'GET',
      })}
      result={createResult(
        'Error: Connection timeout after 30000ms\n\nStack trace:\n  at Request.timeout (node_modules/request/lib/request.js:123:45)\n  at processTicksAndRejections (internal/process/task_queues.js:95:5)',
        true
      )}
    />
  ),
};

export const Running: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('execute_command', 'running', {
        command: 'npm run build',
        cwd: '/project',
      })}
    />
  ),
};

export const Pending: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('write_file', 'pending', {
        path: '/src/new-file.ts',
        content: 'export const foo = "bar";',
      })}
    />
  ),
};

export const LongOutput: Story = {
  render: () => (
    <DialogWrapper
      invocation={createInvocation('list_files', 'completed', {
        path: '/src',
        recursive: true,
      })}
      result={createResult({
        files: Array.from({ length: 50 }, (_, i) => ({
          name: `file-${i + 1}.tsx`,
          path: `/src/components/file-${i + 1}.tsx`,
          size: Math.floor(Math.random() * 10000),
        })),
      })}
    />
  ),
};
