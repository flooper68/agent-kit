import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ChatContainer,
  MessageList,
  Message,
  ChatInput,
  ToolBadge,
  CopyButton,
  RegenerateButton,
} from '../';
import type { ToolInvocationPart } from '../../../types/chat';
import {
  createFileTool,
  searchWebTool,
  executeCodeTool,
  readFileTool,
  multipleToolCalls,
} from './mocks';

const meta: Meta<typeof ChatContainer> = {
  title: 'Chat/Integration/ToolCalls',
  component: ChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tool invocation lifecycle demonstrations showing pending, running, completed, and error states.',
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
type Story = StoryObj<typeof ChatContainer>;

// ============================================
// Tool Pending State
// ============================================

export const ToolPending: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Create a new React component for me</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>I will create that component for you.</p>
              <ToolBadge
                toolName={createFileTool.pending.toolName}
                state={createFileTool.pending.state}
              />
            </div>
          </Message.Bubble>
        </Message>
      </MessageList>
      <ChatInput isSubmitting onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Tool Running State
// ============================================

export const ToolRunning: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Search for React 19 features</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>Let me search for that information.</p>
              <ToolBadge
                toolName={searchWebTool.running.toolName}
                state={searchWebTool.running.state}
              />
            </div>
          </Message.Bubble>
        </Message>
      </MessageList>
      <ChatInput isSubmitting onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Tool Completed State
// ============================================

export const ToolCompleted: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Create a new React component for me</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>I will create that component for you.</p>
              <ToolBadge
                toolName={createFileTool.completed.toolName}
                state={createFileTool.completed.state}
              />
              <p>
                Done! I have created the component at{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-sm">
                  app/page.tsx
                </code>
                . The file includes a basic React component structure with
                TypeScript types.
              </p>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="Done! I have created the component..." />
            <RegenerateButton onRegenerate={() => console.log('Regenerate')} />
          </Message.Actions>
        </Message>
      </MessageList>
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Tool Error State
// ============================================

export const ToolError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Execute this code snippet</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>I will execute that code for you.</p>
              <ToolBadge
                toolName={executeCodeTool.error.toolName}
                state={executeCodeTool.error.state}
              />
              <p className="text-destructive">
                The code execution failed. It looks like there is an error being
                thrown. Would you like me to help debug it?
              </p>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="The code execution failed..." />
            <RegenerateButton onRegenerate={() => console.log('Regenerate')} />
          </Message.Actions>
        </Message>
      </MessageList>
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Multiple Tool Calls
// ============================================

export const MultipleToolCalls: Story = {
  render: () => (
    <ChatContainer className="h-[700px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Update the App component and run the tests
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>
                I will read the current file, make the changes, and run the
                tests for you.
              </p>
              <ToolBadge
                toolName={multipleToolCalls.readFile.invocation.toolName}
                state={multipleToolCalls.readFile.invocation.state}
              />
              <ToolBadge
                toolName={multipleToolCalls.editFile.invocation.toolName}
                state={multipleToolCalls.editFile.invocation.state}
              />
              <ToolBadge
                toolName={multipleToolCalls.runTests.invocation.toolName}
                state={multipleToolCalls.runTests.invocation.state}
              />
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>All 5 tests passed!</span>
              </div>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="All 5 tests passed!" />
            <RegenerateButton onRegenerate={() => console.log('Regenerate')} />
          </Message.Actions>
        </Message>
      </MessageList>
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Tool Call Lifecycle (Animated)
// ============================================

const ToolCallLifecycleComponent = () => {
  const [state, setState] = useState<'pending' | 'running' | 'completed'>(
    'pending'
  );
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setState('running'), 1000),
      setTimeout(() => {
        setState('completed');
      }, 3000),
      setTimeout(() => setShowFollowUp(true), 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const toolInvocation: ToolInvocationPart = {
    ...searchWebTool.pending,
    state,
  };

  return (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            What are the new features in React 19?
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>Let me search for the latest React 19 features.</p>
              <ToolBadge
                toolName={toolInvocation.toolName}
                state={toolInvocation.state}
              />
              {showFollowUp && (
                <p>
                  Based on my search, React 19 introduces several exciting
                  features:
                </p>
              )}
              {showFollowUp && (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Actions</strong> - New way to handle form
                    submissions
                  </li>
                  <li>
                    <strong>useOptimistic</strong> - Hook for optimistic updates
                  </li>
                  <li>
                    <strong>use()</strong> - New hook for reading resources
                  </li>
                  <li>
                    <strong>Server Components</strong> - Improved RSC support
                  </li>
                </ul>
              )}
            </div>
          </Message.Bubble>
        </Message>
      </MessageList>
      <ChatInput isSubmitting={state !== 'completed'} onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  );
};

export const ToolCallLifecycle: Story = {
  render: () => <ToolCallLifecycleComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Animated demonstration of tool call state transitions: pending → running → completed.',
      },
    },
  },
};

// ============================================
// Nested Tool Calls
// ============================================

export const NestedToolCalls: Story = {
  render: () => (
    <ChatContainer className="h-[700px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Analyze the package.json and suggest dependency updates
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>Let me read the package.json first.</p>
              <ToolBadge
                toolName={readFileTool.completed.toolName}
                state={readFileTool.completed.state}
              />
              <p>
                Now let me search for the latest versions of the dependencies.
              </p>
              <ToolBadge toolName="search_npm" state="completed" />
              <p>Here are my recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>react</strong>: 18.2.0 → 19.0.0 (major update - review
                  breaking changes)
                </li>
                <li>
                  <strong>typescript</strong>: 5.2.0 → 5.3.0 (minor update -
                  safe)
                </li>
                <li>
                  <strong>vite</strong>: 5.0.0 → 5.1.0 (minor update - safe)
                </li>
              </ul>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="Here are my recommendations..." />
            <RegenerateButton onRegenerate={() => console.log('Regenerate')} />
          </Message.Actions>
        </Message>
      </MessageList>
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};
