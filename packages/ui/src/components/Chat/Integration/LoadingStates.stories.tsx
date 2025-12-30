import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ChatContainer,
  MessageList,
  Message,
  ChatInput,
  ThinkingIndicator,
  StreamingText,
  LoadingState,
  InterruptButton,
  ToolBadge,
} from '../';
import { searchWebTool } from './mocks';

const meta: Meta<typeof ChatContainer> = {
  title: 'Chat/Integration/Loading',
  component: ChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading, streaming, and thinking state demonstrations for AI chat interfaces.',
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
// Initial Loading State
// ============================================

export const InitialLoading: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <div className="flex-1 p-4">
        <LoadingState count={3} />
      </div>
      <ChatInput isSubmitting onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Loading..." disabled />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton disabled />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Thinking After Submit
// ============================================

export const ThinkingAfterSubmit: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Help me optimize my React application performance
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <ThinkingIndicator status="Thinking" variant="dots" />
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
// Thinking with Detail
// ============================================

export const ThinkingWithDetail: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Analyze this codebase and suggest improvements
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <ThinkingIndicator
              status="Analyzing"
              detail="Reading 47 files..."
              variant="spinner"
            />
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
// Streaming Response
// ============================================

const StreamingResponseComponent = () => {
  const fullText = `I will help you optimize your React application performance. Here are several strategies you can implement:

**1. Code Splitting**
Use React.lazy() and Suspense to split your code into smaller chunks that load on demand.

**2. Memoization**
Use React.memo(), useMemo(), and useCallback() to prevent unnecessary re-renders.

**3. Virtual Lists**
For long lists, use virtualization libraries like react-window or react-virtualized.

**4. Image Optimization**
Lazy load images and use modern formats like WebP.`;

  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Help me optimize my React application performance
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <StreamingText text={displayedText} isStreaming={isStreaming} />
          </Message.Bubble>
        </Message>
      </MessageList>
      <div className="px-4 pb-2">
        {isStreaming && (
          <InterruptButton
            onClick={() => setIsStreaming(false)}
            label="Stop generating"
          />
        )}
      </div>
      <ChatInput isSubmitting={isStreaming} onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  );
};

export const StreamingResponse: Story = {
  render: () => <StreamingResponseComponent />,
};

// ============================================
// Streaming With Tool Call
// ============================================

const StreamingWithToolCallComponent = () => {
  const [phase, setPhase] = useState<'streaming' | 'tool' | 'complete'>(
    'streaming'
  );
  const [streamedText, setStreamedText] = useState('');
  const [toolState, setToolState] = useState<
    'pending' | 'running' | 'completed'
  >('pending');

  const initialText = 'Let me search for the latest React 19 features for you.';

  useEffect(() => {
    // Phase 1: Stream initial text
    let index = 0;
    const streamInterval = setInterval(() => {
      if (index < initialText.length) {
        setStreamedText(initialText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(streamInterval);
        setPhase('tool');
      }
    }, 30);

    return () => clearInterval(streamInterval);
  }, []);

  useEffect(() => {
    if (phase === 'tool') {
      // Tool state transitions
      const timers = [
        setTimeout(() => setToolState('running'), 500),
        setTimeout(() => {
          setToolState('completed');
          setPhase('complete');
        }, 2500),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  const toolInvocation = {
    ...searchWebTool.pending,
    state: toolState,
  };

  return (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>What is new in React 19?</Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <StreamingText
                text={streamedText}
                isStreaming={phase === 'streaming'}
              />
              {phase !== 'streaming' && (
                <ToolBadge
                  toolName={toolInvocation.toolName}
                  state={toolInvocation.state}
                />
              )}
              {phase === 'complete' && (
                <p className="mt-3">
                  Based on my search, React 19 introduces several exciting
                  features including Actions, useOptimistic hook, and improved
                  form handling!
                </p>
              )}
            </div>
          </Message.Bubble>
        </Message>
      </MessageList>
      <ChatInput isSubmitting={phase !== 'complete'} onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  );
};

export const StreamingWithToolCall: Story = {
  render: () => <StreamingWithToolCallComponent />,
};

// ============================================
// Interruptible Streaming
// ============================================

const InterruptibleStreamingComponent = () => {
  const fullText = `Here is a comprehensive guide to building scalable React applications:

## Architecture Patterns

When building large-scale React applications, it is crucial to establish solid architectural foundations. Consider these patterns:

1. **Feature-based folder structure** - Organize code by feature rather than type
2. **State management layers** - Separate local, shared, and server state
3. **API abstraction** - Create a clean interface between your UI and data fetching

## Performance Optimization

React applications can suffer from performance issues as they grow. Key strategies include:

- Component memoization with React.memo
- Lazy loading routes and heavy components
- Virtualization for long lists
- Debouncing expensive operations

## Testing Strategy

A robust testing strategy is essential:

- Unit tests for utilities and hooks
- Integration tests for component interactions
- E2E tests for critical user flows`;

  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      } else {
        setIsStreaming(false);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [isStreaming, charIndex, fullText]);

  const handleInterrupt = () => {
    setIsStreaming(false);
  };

  return (
    <ChatContainer className="h-[700px]">
      <MessageList className="flex-1 p-4">
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            How do I build a scalable React application?
          </Message.Bubble>
        </Message>

        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <StreamingText
              text={displayedText}
              isStreaming={isStreaming}
              showCursor={isStreaming}
            />
          </Message.Bubble>
        </Message>
      </MessageList>

      {isStreaming && (
        <div className="px-4 pb-2 flex justify-center">
          <InterruptButton onClick={handleInterrupt} label="Stop generating" />
        </div>
      )}

      <ChatInput isSubmitting={isStreaming} onSubmit={() => {}}>
        <ChatInput.Textarea placeholder="Ask a follow-up..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  );
};

export const InterruptibleStreaming: Story = {
  render: () => <InterruptibleStreamingComponent />,
};
