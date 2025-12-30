/**
 * Mock scenario configuration for simulating different chat responses
 */
export interface MockToolConfig {
  name: string;
  args: Record<string, unknown>;
  resultDelay?: number;
  error?: boolean;
}

export interface MockScenario {
  trigger: string | RegExp;
  response: string;
  tools?: MockToolConfig[];
  reasoning?: string;
  error?: { type: string; message: string };
}

/**
 * Default scenarios for the mock chat service
 */
export const defaultScenarios: MockScenario[] = [
  // Error scenarios
  {
    trigger: /^error$/i,
    response: '',
    error: { type: 'api', message: 'Simulated API error. Try again.' },
  },
  {
    trigger: /^network error$/i,
    response: '',
    error: { type: 'network', message: 'Network connection lost.' },
  },
  {
    trigger: /^rate limit$/i,
    response: '',
    error: {
      type: 'rate_limit',
      message: 'Too many requests. Please wait a moment.',
    },
  },

  // Tool scenarios - file creation
  {
    trigger: /create.*file|new.*component/i,
    response:
      "I've created the file for you. The component is ready to use with TypeScript types and proper exports.",
    tools: [
      {
        name: 'create_file',
        args: { path: 'src/components/NewComponent.tsx' },
        resultDelay: 1500,
      },
    ],
    reasoning:
      'The user wants to create a new file. I should use the create_file tool to generate the component.',
  },

  // Tool scenarios - search
  {
    trigger: /search|look up|find out/i,
    response:
      'Based on my search, I found several relevant results that should help answer your question.',
    tools: [
      {
        name: 'search_web',
        args: { query: 'user query' },
        resultDelay: 2000,
      },
    ],
  },

  // Tool scenarios - run tests
  {
    trigger: /run tests|test/i,
    response:
      'All tests passed successfully! 12 tests run, 0 failures, 0 skipped.',
    tools: [
      {
        name: 'read_file',
        args: { path: 'package.json' },
        resultDelay: 500,
      },
      {
        name: 'run_tests',
        args: { pattern: '*.test.tsx' },
        resultDelay: 2000,
      },
    ],
    reasoning:
      "I'll first check the package.json for test configuration, then run the test suite.",
  },

  // Tool scenarios - tool failure
  {
    trigger: /fail.*tool|tool.*error/i,
    response:
      'The tool execution failed due to a permission error. Would you like me to try a different approach?',
    tools: [
      {
        name: 'execute_code',
        args: { code: 'throw new Error("Permission denied")' },
        resultDelay: 1000,
        error: true,
      },
    ],
  },

  // Tool scenarios - multiple/nested tools
  {
    trigger: /analyze|review|audit/i,
    response:
      "Here's my comprehensive analysis with recommendations for improving code quality and performance.",
    tools: [
      {
        name: 'read_file',
        args: { path: 'src/index.ts' },
        resultDelay: 500,
      },
      {
        name: 'analyze_code',
        args: { files: ['src/*.ts'], rules: ['complexity', 'duplication'] },
        resultDelay: 1500,
      },
      {
        name: 'search_npm',
        args: { query: 'outdated dependencies' },
        resultDelay: 1000,
      },
    ],
    reasoning:
      'To provide a comprehensive analysis, I need to:\n1. Read the main entry file\n2. Analyze code patterns and complexity\n3. Check for outdated dependencies',
  },

  // Tool scenarios - edit file
  {
    trigger: /edit|modify|update.*file/i,
    response:
      "I've updated the file with your requested changes. The modifications have been saved.",
    tools: [
      {
        name: 'read_file',
        args: { path: 'src/component.tsx' },
        resultDelay: 300,
      },
      {
        name: 'edit_file',
        args: {
          path: 'src/component.tsx',
          changes: 'Added new prop types',
        },
        resultDelay: 800,
      },
    ],
  },

  // Code generation
  {
    trigger: /write.*code|generate|implement/i,
    response:
      "Here's the implementation you requested:\n\n```typescript\nexport function processData(input: string[]): string[] {\n  return input\n    .filter(item => item.length > 0)\n    .map(item => item.trim().toLowerCase());\n}\n```\n\nThis function filters out empty strings and normalizes the remaining items.",
    reasoning:
      'The user wants code generation. I should provide a clean, typed implementation with proper error handling.',
  },
];

/**
 * Default response when no scenario matches
 */
export const defaultResponse = (message: string): string => {
  const truncated =
    message.length > 30 ? message.slice(0, 30) + '...' : message;
  return `I understand you're asking about "${truncated}". Let me help you with that. This is a simulated response to demonstrate the chat interface. In a real application, this would connect to an AI service to provide meaningful assistance.`;
};

/**
 * Default reasoning when includeReasoning is enabled but no scenario reasoning exists
 */
export const defaultReasoning = (message: string): string => {
  return `Let me think about how to respond to this request:\n\n1. Analyze the user's intent\n2. Consider the best approach\n3. Formulate a helpful response\n\nThe user said: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`;
};
