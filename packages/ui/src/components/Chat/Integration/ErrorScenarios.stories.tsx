import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ChatContainer,
  MessageList,
  Message,
  ChatInput,
  ErrorState,
  ToolBadge,
  StreamingText,
  RetryButton,
} from '../';
import { searchWebTool, executeCodeTool } from './mocks';

const meta: Meta<typeof ChatContainer> = {
  title: 'Chat/Integration/Errors',
  component: ChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Error handling scenarios demonstrating API errors, network failures, and recovery patterns.',
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
// API Error
// ============================================

export const APIError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>What is the meaning of life?</Message.Bubble>
        </Message>

        <ErrorState
          title="API Error"
          message="Failed to connect to the AI service. Please check your API key and try again."
          onRetry={() => console.log('Retry clicked')}
        />
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
// Network Error
// ============================================

export const NetworkError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Help me write a function</Message.Bubble>
        </Message>

        <ErrorState
          title="Network Error"
          message="Unable to reach the server. Please check your internet connection and try again."
          onRetry={() => console.log('Retry clicked')}
          retryLabel="Reconnect"
        />
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
// Rate Limit Error
// ============================================

export const RateLimitError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Generate a complex algorithm</Message.Bubble>
        </Message>

        <ErrorState
          title="Rate Limit Exceeded"
          message="You have reached the maximum number of requests. Please wait a moment before trying again."
          onRetry={() => console.log('Retry clicked')}
          retryLabel="Try again"
        />
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
// Partial Stream Error
// ============================================

export const PartialStreamError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Explain the architecture of a microservices system
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <StreamingText
                text="A microservices architecture is a design approach where an application is composed of loosely coupled, independently deployable services. Each service is responsible for a specific business capability and communicates with other services through..."
                isStreaming={false}
              />
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                <div className="flex items-center gap-2 text-destructive text-sm">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Response interrupted: Connection lost</span>
                </div>
                <button
                  className="mt-2 text-sm text-destructive underline hover:no-underline"
                  onClick={() => console.log('Continue clicked')}
                >
                  Continue generating
                </button>
              </div>
            </div>
          </Message.Bubble>
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
// Tool Execution Error
// ============================================

export const ToolExecutionError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Run the test suite</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>I will run the test suite for you.</p>
              <ToolBadge
                toolName={executeCodeTool.error.toolName}
                state={executeCodeTool.error.state}
              />
              <p className="text-destructive">
                The test execution failed with an error. Would you like me to
                analyze the error and suggest fixes?
              </p>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <RetryButton onRetry={() => console.log('Retry')} />
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
// Search Tool Error
// ============================================

export const SearchToolError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Search for the latest TypeScript features
          </Message.Bubble>
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
                toolName={searchWebTool.error.toolName}
                state={searchWebTool.error.state}
              />
              <p>
                I was not able to search the web due to a network error.
                However, I can tell you about TypeScript features based on my
                training data. Would you like me to do that instead?
              </p>
            </div>
          </Message.Bubble>
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
// Recoverable Error (Interactive)
// ============================================

const RecoverableErrorComponent = () => {
  const [hasError, setHasError] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([{ role: 'user', content: 'What is quantum computing?' }]);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate retry delay
    await new Promise((r) => setTimeout(r, 1500));
    setHasError(false);
    setIsRetrying(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          'Quantum computing is a type of computation that harnesses quantum mechanical phenomena like superposition and entanglement to process information in fundamentally new ways. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or "qubits" that can exist in multiple states simultaneously.',
      },
    ]);
  };

  return (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role}>
            <Message.Avatar
              fallback={msg.role === 'user' ? 'U' : 'AI'}
              src={
                msg.role === 'assistant'
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
                  : undefined
              }
            />
            <Message.Bubble>{msg.content}</Message.Bubble>
          </Message>
        ))}

        {hasError && !isRetrying && (
          <ErrorState
            title="Request Failed"
            message="The server encountered an error processing your request."
            onRetry={handleRetry}
            retryLabel="Try again"
          />
        )}

        {isRetrying && (
          <Message role="assistant">
            <Message.Avatar
              fallback="AI"
              src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
            />
            <Message.Bubble>
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Retrying...</span>
              </div>
            </Message.Bubble>
          </Message>
        )}
      </MessageList>
      <ChatInput
        onSubmit={(v) => console.log('Submit:', v)}
        isSubmitting={isRetrying}
      >
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  );
};

export const RecoverableError: Story = {
  render: () => <RecoverableErrorComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demonstration of error recovery. Click "Try again" to see the successful response.',
      },
    },
  },
};

// ============================================
// Message Level Error
// ============================================

export const MessageLevelError: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Show me the project structure</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>Here is the project structure:</Message.Bubble>
        </Message>

        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>Now add a new component</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-destructive">
                      Failed to generate response
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The model encountered an error while processing this
                      request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <RetryButton onRetry={() => console.log('Retry this message')} />
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
