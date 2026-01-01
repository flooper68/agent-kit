import type { Meta, StoryObj } from '@storybook/react';
import { MessageList } from './MessageList';

const meta: Meta<typeof MessageList> = {
  title: 'Chat/Chat Components/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A scrollable container for chat messages with automatic scroll-to-bottom behavior.

**Features:**
- Auto-scrolls to bottom when new messages arrive
- Shows a scroll-to-bottom button when user scrolls up
- Thin custom scrollbar styling
- Exposes imperative methods via ref (scrollToBottom, scrollToTop)
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[400px] border border-border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageList>;

// Sample message bubble component for stories
const MessageBubble = ({
  content,
  isUser = false,
}: {
  content: string;
  isUser?: boolean;
}) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[80%] rounded-lg px-4 py-2 ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground'
      }`}
    >
      {content}
    </div>
  </div>
);

export const Default: Story = {
  render: () => (
    <MessageList>
      <MessageBubble content="Hello! How can I help you today?" />
      <MessageBubble content="I need help with my code" isUser />
      <MessageBubble content="Of course! What kind of code are you working on?" />
      <MessageBubble content="A React component" isUser />
      <MessageBubble content="Great! React is a wonderful library. What specific issue are you facing with your component?" />
    </MessageList>
  ),
};

export const WithScrollButton: Story = {
  render: () => (
    <MessageList>
      {Array.from({ length: 20 }, (_, i) => (
        <MessageBubble
          key={i}
          content={`Message ${i + 1}: ${i % 2 === 0 ? 'This is an assistant message with some helpful content.' : 'This is a user message.'}`}
          isUser={i % 2 === 1}
        />
      ))}
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With many messages, scroll up to see the scroll-to-bottom button appear.',
      },
    },
  },
};

export const LongConversation: Story = {
  render: () => (
    <MessageList>
      <MessageBubble content="Welcome to the AI assistant! I'm here to help you with coding questions." />
      <MessageBubble content="Thanks! Can you explain React hooks?" isUser />
      <MessageBubble content="React Hooks are functions that let you use state and other React features in functional components. The most common hooks are useState for managing state, useEffect for side effects, and useContext for accessing context." />
      <MessageBubble content="What about useCallback?" isUser />
      <MessageBubble content="useCallback is a hook that returns a memoized version of a callback function. It's useful when passing callbacks to child components that rely on reference equality to prevent unnecessary renders." />
      <MessageBubble content="Can you show me an example?" isUser />
      <MessageBubble content="Sure! Here's a simple example:\n\nconst handleClick = useCallback(() => {\n  console.log('Button clicked');\n}, []);\n\nThis creates a stable reference to the function that won't change between renders unless the dependencies change." />
      <MessageBubble content="That makes sense!" isUser />
      <MessageBubble content="Great! Let me know if you have any other questions about React hooks or any other topic." />
      <MessageBubble content="What's useMemo for?" isUser />
      <MessageBubble content="useMemo is similar to useCallback, but instead of memoizing a function, it memoizes a computed value. It's useful for expensive calculations that you don't want to repeat on every render." />
      <MessageBubble content="Perfect, thanks for the explanation!" isUser />
      <MessageBubble content="You're welcome! Happy coding! 🚀" />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A realistic conversation demonstrating the message list layout.',
      },
    },
  },
};

export const AutoScrollDisabled: Story = {
  render: () => (
    <MessageList autoScroll={false}>
      {Array.from({ length: 15 }, (_, i) => (
        <MessageBubble
          key={i}
          content={`Message ${i + 1}`}
          isUser={i % 2 === 1}
        />
      ))}
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With autoScroll disabled, the list will not automatically scroll to the bottom when new messages are added.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => <MessageList>{null}</MessageList>,
  parameters: {
    docs: {
      description: {
        story: 'Empty message list with no content.',
      },
    },
  },
};
