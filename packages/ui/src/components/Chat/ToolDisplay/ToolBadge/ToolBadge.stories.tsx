import type { Meta, StoryObj } from '@storybook/react';
import { ToolBadge } from './ToolBadge';
import type { ToolResultPart } from '../../../../types/chat';

const createResult = (result: unknown, isError = false): ToolResultPart => ({
  type: 'tool_result',
  id: 'res-1',
  toolCallId: 'tool-1',
  result,
  isError,
});

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
    args: {
      control: 'object',
      description: 'Tool arguments - when provided, clicking opens a dialog',
    },
    result: {
      control: 'object',
      description: 'Tool result - displayed in the dialog',
    },
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

// Dialog functionality stories

export const WithDialog: Story = {
  args: {
    toolName: 'read_file',
    state: 'completed',
    args: {
      path: '/src/components/Button.tsx',
    },
    result: createResult(
      'export const Button = () => {\n  return <button>Click me</button>;\n};'
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the badge to open a dialog showing tool input and output.',
      },
    },
  },
};

export const DialogWithComplexOutput: Story = {
  args: {
    toolName: 'search_codebase',
    state: 'completed',
    args: {
      query: 'useState',
      filePattern: '*.tsx',
      maxResults: 10,
    },
    result: createResult({
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
    }),
  },
};

export const DialogWithError: Story = {
  args: {
    toolName: 'api_request',
    state: 'error',
    args: {
      url: 'https://api.example.com/data',
      method: 'GET',
    },
    result: createResult(
      'Error: Connection timeout after 30000ms\n\nStack trace:\n  at Request.timeout (node_modules/request/lib/request.js:123:45)',
      true
    ),
  },
};

export const DialogRunning: Story = {
  args: {
    toolName: 'execute_command',
    state: 'running',
    args: {
      command: 'npm run build',
      cwd: '/project',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "Tool is currently executing..." when no result yet.',
      },
    },
  },
};

export const DialogPending: Story = {
  args: {
    toolName: 'write_file',
    state: 'pending',
    args: {
      path: '/src/new-file.ts',
      content: 'export const foo = "bar";',
    },
  },
};

export const AllStatesWithDialog: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ToolBadge
        toolName="pending_task"
        state="pending"
        args={{ action: 'create' }}
      />
      <ToolBadge
        toolName="running_task"
        state="running"
        args={{ action: 'process' }}
      />
      <ToolBadge
        toolName="completed_task"
        state="completed"
        args={{ action: 'done' }}
        result={createResult('Success!')}
      />
      <ToolBadge
        toolName="failed_task"
        state="error"
        args={{ action: 'fail' }}
        result={createResult('Something went wrong', true)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All states with dialog functionality. Click any badge to see its details.',
      },
    },
  },
};
