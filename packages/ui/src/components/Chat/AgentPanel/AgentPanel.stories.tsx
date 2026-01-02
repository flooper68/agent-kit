import { useState, useCallback, useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Bot, Code } from 'lucide-react';
import { AgentPanel } from './AgentPanel';
import type { AgentPanelRef } from './types';
import { MockChatService } from './mocks/MockChatService';
import type {
  AgentType,
  TaskMessage,
  TaskStatus,
  SuggestionChip,
  ThinkingStatus,
} from '../../../types/chat';
import type { TaskError } from './types';
import {
  createMessage,
  createTextPart,
  createReasoningPart,
  createToolInvocationPart,
} from '../Integration/mocks/messages';

const meta: Meta<typeof AgentPanel> = {
  title: 'Chat/AgentPanel',
  component: AgentPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AgentPanel is a complete chat interface component that composes all Chat primitives
into a cohesive AI assistant experience. It handles all states: empty, loading,
streaming, error, and normal conversation.

## Features
- Message display with user/assistant styling
- Empty state with suggestions
- Thinking indicator during processing
- Word-by-word streaming
- Tool call visualization
- Error handling with retry
- Interrupt capability
- Optional attachments and model switching
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentPanel>;

// ============================================
// Default Suggestions
// ============================================

const defaultSuggestions: SuggestionChip[] = [
  { id: '1', text: 'Create a landing page', prompt: 'Create a landing page' },
  { id: '2', text: 'Help me debug', prompt: 'Help me debug my code' },
  { id: '3', text: 'Explain this code', prompt: 'Explain this code' },
  { id: '4', text: 'Write tests', prompt: 'Write tests for my component' },
];

const defaultAvatars = {
  assistant: { fallback: 'AI' },
  user: { fallback: 'U' },
};

// ============================================
// 1. Empty State
// ============================================

export const Empty: Story = {
  render: () => (
    <AgentPanel
      messages={[]}
      status="ready"
      suggestions={defaultSuggestions}
      emptyStateConfig={{
        title: 'What do you want to create?',
        description: 'Describe your idea and I will help you build it',
      }}
      avatars={defaultAvatars}
      onSend={(msg) => console.log('Send:', msg)}
      onSuggestionClick={(s) => console.log('Suggestion:', s)}
    />
  ),
};

// ============================================
// 2. Interactive Demo with Mock Service
// ============================================

const InteractiveDemoComponent = () => {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [error, setError] = useState<TaskError | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });

  const panelRef = useRef<AgentPanelRef>(null);

  const mockService = useRef(
    new MockChatService(
      {
        onStatusChange: setStatus,
        onMessageAdd: (msg) => setMessages((prev) => [...prev, msg]),
        onMessageUpdate: (id, updates) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
          ),
        onThinkingStatusChange: setThinkingStatus,
        onError: setError,
      },
      {
        thinkingDelay: 1500,
        streamingWordDelay: 40,
        includeReasoning: true,
      }
    )
  ).current;

  const handleSend = useCallback(
    async (message: string) => {
      setError(null);
      await mockService.sendMessage(message);
    },
    [mockService]
  );

  const handleInterrupt = useCallback(() => {
    mockService.interrupt();
  }, [mockService]);

  const handleRetry = useCallback(async () => {
    setError(null);
    await mockService.retry();
  }, [mockService]);

  return (
    <AgentPanel
      ref={panelRef}
      messages={messages}
      status={status}
      error={error}
      thinkingStatus={thinkingStatus}
      suggestions={defaultSuggestions}
      emptyStateConfig={{
        title: 'Interactive Demo',
        description:
          'Try: "create file", "search", "error", "analyze", "fail tool"',
      }}
      avatars={defaultAvatars}
      onSend={handleSend}
      onInterrupt={handleInterrupt}
      onRetry={handleRetry}
      onSuggestionClick={(s) => handleSend(s.prompt ?? s.text)}
      onRegenerate={(id) => console.log('Regenerate:', id)}
    />
  );
};

export const InteractiveDemo: Story = {
  render: () => <InteractiveDemoComponent />,
  parameters: {
    docs: {
      description: {
        story: `
Fully interactive demo with mock chat service.

**Try these commands:**
- \`create file\` - Triggers file creation tool
- \`search\` - Triggers web search tool
- \`analyze\` - Triggers multiple nested tools with reasoning
- \`run tests\` - Triggers read_file + run_tests tools
- \`error\` - Simulates API error
- \`network error\` - Simulates network error
- \`rate limit\` - Simulates rate limit error
- \`fail tool\` - Simulates tool execution failure
- Any other text - Generic streaming response
        `,
      },
    },
  },
};

// ============================================
// 3. Live Message Updates
// ============================================

const LiveUpdatesComponent = () => {
  const text =
    'This is a response that appears word by word to simulate real AI generation. Each word is revealed sequentially to create a natural typing effect.';

  // Track messages with live updates
  const [messages, setMessages] = useState<TaskMessage[]>(() => [
    createMessage('user', [createTextPart('Hello!')]),
    createMessage('assistant', [createTextPart('')]),
  ]);

  // Memoize callbacks
  const handleSend = useCallback(() => {}, []);
  const handleInterrupt = useCallback(() => console.log('Interrupted'), []);

  useEffect(() => {
    const words = text.split(' ');
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        const currentText = words.slice(0, index + 1).join(' ');
        // Update the assistant message's text part directly
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage) {
            lastMessage.parts = [createTextPart(currentText)];
          }
          return newMessages;
        });
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <AgentPanel
      messages={messages}
      status="streaming"
      avatars={defaultAvatars}
      onSend={handleSend}
      onInterrupt={handleInterrupt}
    />
  );
};

export const LiveUpdates: Story = {
  render: () => <LiveUpdatesComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how the parent component can update message parts directly to create a streaming effect.',
      },
    },
  },
};

// ============================================
// 4. Tool Call States
// ============================================

export const ToolCallPending: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Create a new component file')]),
        createMessage('assistant', [
          createTextPart("I'll create the component file for you."),
          createToolInvocationPart(
            'create_file',
            { path: 'src/Component.tsx' },
            'pending'
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

export const ToolCallRunning: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Search for React hooks')]),
        createMessage('assistant', [
          createTextPart('Searching for React hooks documentation...'),
          createToolInvocationPart(
            'search_web',
            { query: 'React hooks best practices' },
            'running'
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

export const ToolCallCompleted: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Create a new component file')]),
        createMessage('assistant', [
          createToolInvocationPart(
            'create_file',
            { path: 'src/Component.tsx' },
            'completed'
          ),
          createTextPart(
            "I've created the component file at src/Component.tsx. It includes TypeScript types and proper exports."
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

export const ToolCallError: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Execute this code')]),
        createMessage('assistant', [
          createToolInvocationPart(
            'execute_code',
            { code: 'throw new Error()' },
            'error'
          ),
          createTextPart(
            'The code execution failed due to a permission error. Would you like me to try a different approach?'
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

export const MultipleToolCalls: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Run the tests')]),
        createMessage('assistant', [
          createReasoningPart(
            "I'll check the package.json for test configuration, then run the test suite.",
            true
          ),
          createToolInvocationPart(
            'read_file',
            { path: 'package.json' },
            'completed'
          ),
          createToolInvocationPart(
            'run_tests',
            { pattern: '*.test.tsx' },
            'completed'
          ),
          createTextPart(
            'All tests passed! 12 tests run, 0 failures, 0 skipped.'
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

export const NestedToolCalls: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Analyze my codebase')]),
        createMessage('assistant', [
          createReasoningPart(
            'To provide a comprehensive analysis, I need to:\n1. Read the main entry file\n2. Analyze code patterns and complexity\n3. Check for outdated dependencies',
            false
          ),
          createToolInvocationPart(
            'read_file',
            { path: 'src/index.ts' },
            'completed'
          ),
          createToolInvocationPart(
            'analyze_code',
            { files: ['src/*.ts'], rules: ['complexity', 'duplication'] },
            'completed'
          ),
          createToolInvocationPart(
            'search_npm',
            { query: 'outdated dependencies' },
            'completed'
          ),
          createTextPart(
            "Here's my comprehensive analysis with recommendations for improving code quality and performance."
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

// ============================================
// 5. Error Scenarios
// ============================================

export const APIError: Story = {
  render: () => (
    <AgentPanel
      messages={[createMessage('user', [createTextPart('Hello!')])]}
      status="error"
      error={{
        type: 'api',
        message: 'Failed to connect to AI service. Please check your API key.',
        retryable: true,
      }}
      avatars={defaultAvatars}
      onSend={() => {}}
      onRetry={() => console.log('Retry')}
    />
  ),
};

export const NetworkError: Story = {
  render: () => (
    <AgentPanel
      messages={[]}
      status="error"
      error={{
        type: 'network',
        message: 'No internet connection. Please check your network.',
        retryable: true,
      }}
      avatars={defaultAvatars}
      onSend={() => {}}
      onRetry={() => console.log('Retry')}
      onErrorDismiss={() => console.log('Dismissed')}
    />
  ),
};

export const RateLimitError: Story = {
  render: () => (
    <AgentPanel
      messages={[createMessage('user', [createTextPart('Hello!')])]}
      status="error"
      error={{
        type: 'rate_limit',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryable: true,
      }}
      avatars={defaultAvatars}
      onSend={() => {}}
      onRetry={() => console.log('Retry')}
      onErrorDismiss={() => console.log('Dismissed')}
    />
  ),
};

// ============================================
// 6. With Features Enabled
// ============================================

export const WithAttachments: Story = {
  render: () => (
    <AgentPanel
      messages={[]}
      status="ready"
      suggestions={defaultSuggestions}
      emptyStateConfig={{
        title: 'Upload files to get started',
        description: 'You can attach images or documents',
      }}
      avatars={defaultAvatars}
      enableAttachments
      onSend={(msg) => console.log('Send:', msg)}
      onAttach={(files) => console.log('Attach:', files)}
    />
  ),
};

export const WithContextUsage: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('What is TypeScript?')]),
        createMessage('assistant', [
          createTextPart(
            'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.'
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      contextUsage={{ used: 15000, total: 200000, percentage: 7.5 }}
      onSend={(msg) => console.log('Send:', msg)}
    />
  ),
};

export const WithTokenWarning: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('Continue the analysis...')]),
        createMessage('assistant', [
          createTextPart(
            "I've been analyzing your codebase extensively. We're approaching the context limit."
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      contextUsage={{ used: 180000, total: 200000, percentage: 90 }}
      onSend={(msg) => console.log('Send:', msg)}
    />
  ),
};

// ============================================
// 7. Full Conversation
// ============================================

export const FullConversation: Story = {
  render: () => (
    <AgentPanel
      messages={[
        createMessage('user', [createTextPart('What is TypeScript?')]),
        createMessage('assistant', [
          createTextPart(
            'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds optional static typing and class-based object-oriented programming to the language.'
          ),
        ]),
        createMessage('user', [
          createTextPart('Can you show me a simple example?'),
        ]),
        createMessage('assistant', [
          createTextPart(
            'Here\'s a simple TypeScript example:\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}\n\nconst user: User = { name: "Alice", age: 30 };\nconsole.log(greet(user));\n```\n\nThis demonstrates type annotations and interfaces.'
          ),
        ]),
        createMessage('user', [createTextPart('Create a React component')]),
        createMessage('assistant', [
          createReasoningPart(
            'The user wants a React component. I should create a well-typed functional component with props.',
            true
          ),
          createToolInvocationPart(
            'create_file',
            { path: 'src/Button.tsx' },
            'completed'
          ),
          createTextPart(
            "I've created a Button component with TypeScript types and Tailwind CSS styling."
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      onSend={(msg) => console.log('Send:', msg)}
      onRegenerate={(id) => console.log('Regenerate:', id)}
    />
  ),
};

// ============================================
// 8. Thinking State
// ============================================

export const Thinking: Story = {
  render: () => (
    <AgentPanel
      messages={[createMessage('user', [createTextPart('Analyze my code')])]}
      status="submitted"
      thinkingStatus={{
        isThinking: true,
        status: 'Thinking',
        detail: 'Reading 47 files...',
      }}
      avatars={defaultAvatars}
      onSend={() => {}}
    />
  ),
};

// ============================================
// 9. Agent Selection
// ============================================

const defaultAgentTypes: AgentType[] = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'Helpful for everyday tasks and questions',
    icon: <Bot className="h-5 w-5" />,
  },
  {
    id: 'code',
    name: 'Code Expert',
    description: 'Specialized in programming and debugging',
    icon: <Code className="h-5 w-5" />,
  },
];

const WithAgentSelectionComponent = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | undefined>(
    defaultAgentTypes[0]
  );

  return (
    <AgentPanel
      messages={[]}
      status="ready"
      suggestions={defaultSuggestions}
      emptyStateConfig={{
        title: 'Choose an agent to get started',
        description: 'Select the type of assistant that best fits your needs',
      }}
      avatars={defaultAvatars}
      agents={defaultAgentTypes}
      selectedAgent={selectedAgent}
      onAgentSelect={(agent) => {
        console.log('Agent selected:', agent);
        setSelectedAgent(agent);
      }}
      onSend={(msg) => console.log('Send:', msg)}
    />
  );
};

export const WithAgentSelection: Story = {
  render: () => <WithAgentSelectionComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Shows agent type selection in the empty state. Users can choose between different agent types before starting a conversation.',
      },
    },
  },
};

// ============================================
// 10. With Messages + Agent Info Badge
// ============================================

const WithAgentInfoBadgeComponent = () => {
  const [selectedAgent] = useState<AgentType>(defaultAgentTypes[1]!); // Code Expert

  return (
    <AgentPanel
      messages={[
        createMessage('user', [
          createTextPart('Help me refactor this function'),
        ]),
        createMessage('assistant', [
          createReasoningPart(
            'Looking at the function, I can see several opportunities for improvement...',
            true
          ),
          createTextPart(
            "I've analyzed your function. Here are my suggestions for refactoring:\n\n1. Extract common logic into a helper\n2. Use more descriptive variable names\n3. Add proper TypeScript types"
          ),
        ]),
      ]}
      status="ready"
      avatars={defaultAvatars}
      selectedAgent={selectedAgent}
      onSend={(msg) => console.log('Send:', msg)}
    />
  );
};

export const WithAgentInfoBadge: Story = {
  render: () => <WithAgentInfoBadgeComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Shows the agent info badge above the message list when a conversation is active. Click the info button to see agent details.',
      },
    },
  },
};
