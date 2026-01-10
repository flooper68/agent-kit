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
  title: 'Chat/Chat Components/ToolBadge',
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

// Skill tool stories - tests special display handling
// These tools show friendly names instead of generic tool names

export const ExecuteSkillDirect: Story = {
  args: {
    toolName: 'executeSkill',
    state: 'completed',
    args: {
      command: 'webSearch --query "typescript best practices"',
    },
    result: createResult({ results: ['result1', 'result2'] }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Direct executeSkill call shows "Web Search: query"',
      },
    },
  },
};

export const ExecuteSkillMCP: Story = {
  args: {
    toolName: 'mcp__agent-kit-server__executeSkill',
    state: 'completed',
    args: {
      command: 'webSearch --query "react hooks tutorial"',
    },
    result: createResult({ results: ['hook info'] }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'MCP-prefixed executeSkill shows same "Web Search: query" display',
      },
    },
  },
};

export const ReadSkillFileDirect: Story = {
  args: {
    toolName: 'readSkillFile',
    state: 'running',
    args: {
      path: 'web-research/SKILL.md',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Direct readSkillFile call shows "Learn: path"',
      },
    },
  },
};

export const ReadSkillFileMCP: Story = {
  args: {
    toolName: 'mcp__agent-kit-server__readSkillFile',
    state: 'running',
    args: {
      path: 'project-tools/SKILL.md',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP-prefixed readSkillFile shows same "Learn: path" display',
      },
    },
  },
};

export const GrepSkillsDirect: Story = {
  args: {
    toolName: 'grepSkills',
    state: 'completed',
    args: {
      pattern: 'create task',
    },
    result: createResult({ matches: ['line 1', 'line 2'] }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Direct grepSkills call shows "Search: pattern"',
      },
    },
  },
};

export const GrepSkillsMCP: Story = {
  args: {
    toolName: 'mcp__agent-kit-server__grepSkills',
    state: 'completed',
    args: {
      pattern: 'web search',
    },
    result: createResult({ matches: ['skill doc'] }),
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP-prefixed grepSkills shows same "Search: pattern" display',
      },
    },
  },
};

export const AllSkillTools: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium">Direct tool names:</div>
      <div className="flex flex-wrap gap-2">
        <ToolBadge
          toolName="executeSkill"
          state="completed"
          args={{ command: 'webSearch --query "test"' }}
        />
        <ToolBadge
          toolName="readSkillFile"
          state="running"
          args={{ path: 'skills/SKILL.md' }}
        />
        <ToolBadge
          toolName="grepSkills"
          state="completed"
          args={{ pattern: 'search term' }}
        />
      </div>
      <div className="text-sm font-medium">MCP-prefixed tool names:</div>
      <div className="flex flex-wrap gap-2">
        <ToolBadge
          toolName="mcp__agent-kit-server__executeSkill"
          state="completed"
          args={{ command: 'webSearch --query "test"' }}
        />
        <ToolBadge
          toolName="mcp__agent-kit-server__readSkillFile"
          state="running"
          args={{ path: 'skills/SKILL.md' }}
        />
        <ToolBadge
          toolName="mcp__agent-kit-server__grepSkills"
          state="completed"
          args={{ pattern: 'search term' }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison of direct vs MCP-prefixed tool names. Both should display identically.',
      },
    },
  },
};
