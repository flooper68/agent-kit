import type {
  ToolInvocationPart,
  ToolResultPart,
} from '../../../../types/chat';
import { generateId } from './messages';

// Factory for creating tool invocations
export const createToolInvocation = (
  toolName: string,
  args: Record<string, unknown>,
  state: ToolInvocationPart['state'] = 'pending'
): ToolInvocationPart => ({
  id: generateId(),
  type: 'tool_invocation',
  toolName,
  toolCallId: `call_${toolName}_${Date.now()}`,
  args,
  state,
});

// Factory for creating tool results
export const createToolResult = (
  toolCallId: string,
  result: unknown,
  isError = false
): ToolResultPart => ({
  id: generateId(),
  type: 'tool_result',
  toolCallId,
  result,
  isError,
});

// ============================================
// Tool Scenarios - Create File
// ============================================

const createFileToolCallId = 'call_create_file_1';

export const createFileTool = {
  pending: createToolInvocation(
    'create_file',
    { path: 'app/page.tsx', content: '// Component content...' },
    'pending'
  ),
  running: {
    ...createToolInvocation(
      'create_file',
      { path: 'app/page.tsx', content: '// Component content...' },
      'running'
    ),
    toolCallId: createFileToolCallId,
  } as ToolInvocationPart,
  completed: {
    ...createToolInvocation(
      'create_file',
      { path: 'app/page.tsx', content: '// Component content...' },
      'completed'
    ),
    toolCallId: createFileToolCallId,
  } as ToolInvocationPart,
  completedResult: createToolResult(createFileToolCallId, {
    success: true,
    path: 'app/page.tsx',
    message: 'File created successfully',
  }),
  error: {
    ...createToolInvocation(
      'create_file',
      { path: 'app/page.tsx', content: '// Component content...' },
      'error'
    ),
    toolCallId: createFileToolCallId,
  } as ToolInvocationPart,
  errorResult: createToolResult(
    createFileToolCallId,
    'Permission denied: Cannot write to app/page.tsx',
    true
  ),
};

// ============================================
// Tool Scenarios - Review Work
// ============================================

const reviewWorkToolCallId = 'call_review_work_1';

export const reviewWorkTool = {
  pending: createToolInvocation('review_work', {}, 'pending'),
  running: {
    ...createToolInvocation('review_work', {}, 'running'),
    toolCallId: reviewWorkToolCallId,
  } as ToolInvocationPart,
  completed: {
    ...createToolInvocation('review_work', {}, 'completed'),
    toolCallId: reviewWorkToolCallId,
  } as ToolInvocationPart,
  completedResult: createToolResult(reviewWorkToolCallId, {
    issues: 0,
    warnings: 0,
    summary: 'No issues found',
  }),
};

// ============================================
// Tool Scenarios - Search Web
// ============================================

const searchWebToolCallId = 'call_search_web_1';

export const searchWebTool = {
  pending: createToolInvocation(
    'search_web',
    { query: 'React 19 new features 2024' },
    'pending'
  ),
  running: {
    ...createToolInvocation(
      'search_web',
      { query: 'React 19 new features 2024' },
      'running'
    ),
    toolCallId: searchWebToolCallId,
  } as ToolInvocationPart,
  completed: {
    ...createToolInvocation(
      'search_web',
      { query: 'React 19 new features 2024' },
      'completed'
    ),
    toolCallId: searchWebToolCallId,
  } as ToolInvocationPart,
  completedResult: createToolResult(searchWebToolCallId, {
    results: [
      {
        title: 'React 19 Release Notes',
        url: 'https://react.dev/blog/2024/react-19',
        snippet: 'React 19 introduces Actions, useOptimistic, and more...',
      },
      {
        title: "What's New in React 19",
        url: 'https://example.com/react-19-features',
        snippet: 'A comprehensive guide to React 19 features...',
      },
    ],
  }),
  error: {
    ...createToolInvocation(
      'search_web',
      { query: 'React 19 new features 2024' },
      'error'
    ),
    toolCallId: searchWebToolCallId,
  } as ToolInvocationPart,
  errorResult: createToolResult(
    searchWebToolCallId,
    'Network error: Unable to connect to search service',
    true
  ),
};

// ============================================
// Tool Scenarios - Execute Code
// ============================================

const executeCodeToolCallId = 'call_execute_code_1';

export const executeCodeTool = {
  pending: createToolInvocation(
    'execute_code',
    {
      language: 'typescript',
      code: 'console.log("Hello, World!");',
    },
    'pending'
  ),
  running: {
    ...createToolInvocation(
      'execute_code',
      {
        language: 'typescript',
        code: 'console.log("Hello, World!");',
      },
      'running'
    ),
    toolCallId: executeCodeToolCallId,
  } as ToolInvocationPart,
  completed: {
    ...createToolInvocation(
      'execute_code',
      {
        language: 'typescript',
        code: 'console.log("Hello, World!");',
      },
      'completed'
    ),
    toolCallId: executeCodeToolCallId,
  } as ToolInvocationPart,
  completedResult: createToolResult(executeCodeToolCallId, {
    stdout: 'Hello, World!\n',
    stderr: '',
    exitCode: 0,
  }),
  error: {
    ...createToolInvocation(
      'execute_code',
      {
        language: 'typescript',
        code: 'throw new Error("Test error");',
      },
      'error'
    ),
    toolCallId: executeCodeToolCallId,
  } as ToolInvocationPart,
  errorResult: createToolResult(
    executeCodeToolCallId,
    'Error: Test error\n    at <anonymous>:1:7',
    true
  ),
};

// ============================================
// Tool Scenarios - Read File
// ============================================

const readFileToolCallId = 'call_read_file_1';

export const readFileTool = {
  pending: createToolInvocation(
    'read_file',
    { path: 'package.json' },
    'pending'
  ),
  running: {
    ...createToolInvocation('read_file', { path: 'package.json' }, 'running'),
    toolCallId: readFileToolCallId,
  } as ToolInvocationPart,
  completed: {
    ...createToolInvocation('read_file', { path: 'package.json' }, 'completed'),
    toolCallId: readFileToolCallId,
  } as ToolInvocationPart,
  completedResult: createToolResult(readFileToolCallId, {
    content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}',
    path: 'package.json',
  }),
};

// ============================================
// Multiple Tool Calls Scenario
// ============================================

export const multipleToolCalls = {
  readFile: {
    invocation: {
      ...createToolInvocation(
        'read_file',
        { path: 'src/App.tsx' },
        'completed'
      ),
      toolCallId: 'call_read_1',
    } as ToolInvocationPart,
    result: createToolResult('call_read_1', {
      content: 'export function App() { return <div>Hello</div> }',
    }),
  },
  editFile: {
    invocation: {
      ...createToolInvocation(
        'edit_file',
        {
          path: 'src/App.tsx',
          changes: [
            {
              line: 1,
              content: 'export function App() { return <div>Updated</div> }',
            },
          ],
        },
        'completed'
      ),
      toolCallId: 'call_edit_1',
    } as ToolInvocationPart,
    result: createToolResult('call_edit_1', { success: true }),
  },
  runTests: {
    invocation: {
      ...createToolInvocation(
        'run_tests',
        { pattern: '*.test.tsx' },
        'completed'
      ),
      toolCallId: 'call_test_1',
    } as ToolInvocationPart,
    result: createToolResult('call_test_1', {
      passed: 5,
      failed: 0,
      skipped: 0,
    }),
  },
};
