import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/test';
import {
  ChatContainer,
  MessageList,
  Message,
  ChatInput,
  EmptyState,
  ToolCallDisplay,
  ReasoningDisplay,
  CopyButton,
  RegenerateButton,
} from '../';
import type {
  SuggestionChip,
  ChatMessage,
  TextPart,
} from '../../../types/chat';
import {
  simpleConversation,
  conversationWithCode,
  conversationWithReasoning,
  createFileTool,
  reviewWorkTool,
} from './mocks';

const meta: Meta<typeof ChatContainer> = {
  title: 'Chat/Integration/Simulation',
  component: ChatContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full chat interface simulations demonstrating realistic AI assistant interactions.',
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

// Helper to extract text content from a message
const getTextContent = (msg: ChatMessage): string => {
  return msg.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.content)
    .join('\n');
};

// ============================================
// Empty Chat State
// ============================================

const suggestions: SuggestionChip[] = [
  { id: '1', text: 'Create a landing page', prompt: 'Create a landing page' },
  { id: '2', text: 'Help me debug', prompt: 'Help me debug my code' },
  { id: '3', text: 'Explain this code', prompt: 'Explain this code' },
  { id: '4', text: 'Write tests', prompt: 'Write tests for my component' },
];

export const EmptyChat: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <EmptyState
        title="How can I help you today?"
        description="Ask me anything about your code or project"
        suggestions={suggestions}
        onSuggestionClick={(s) => console.log('Suggestion clicked:', s.text)}
      />
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask Lovable..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
};

// ============================================
// Simple Conversation
// ============================================

export const SimpleConversation: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        {simpleConversation.map((msg) => (
          <Message key={msg.id} role={msg.role}>
            <Message.Avatar
              fallback={msg.role === 'user' ? 'U' : 'AI'}
              src={
                msg.role === 'assistant'
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
                  : undefined
              }
            />
            <Message.Bubble>{getTextContent(msg)}</Message.Bubble>
            {msg.role === 'assistant' && (
              <Message.Actions>
                <CopyButton content={getTextContent(msg)} />
                <RegenerateButton
                  onRegenerate={() => console.log('Regenerate')}
                />
              </Message.Actions>
            )}
          </Message>
        ))}
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
// Conversation with Code
// ============================================

export const ConversationWithCode: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        {conversationWithCode.map((msg) => (
          <Message key={msg.id} role={msg.role}>
            <Message.Avatar
              fallback={msg.role === 'user' ? 'U' : 'AI'}
              src={
                msg.role === 'assistant'
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
                  : undefined
              }
            />
            <Message.Bubble>
              <div className="whitespace-pre-wrap">{getTextContent(msg)}</div>
            </Message.Bubble>
            {msg.role === 'assistant' && (
              <Message.Actions>
                <CopyButton content={getTextContent(msg)} />
                <RegenerateButton
                  onRegenerate={() => console.log('Regenerate')}
                />
              </Message.Actions>
            )}
          </Message>
        ))}
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
// Conversation with Tool Calls
// ============================================

export const ConversationWithToolCalls: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        {/* User message */}
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>developer landing page / blog</Message.Bubble>
        </Message>

        {/* Assistant thinking */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <ReasoningDisplay
              content="The user wants to create a developer landing page or blog. Let me think about the structure:

1. Hero section with introduction
2. Featured projects/posts
3. Skills/technologies section
4. Contact information

I should create a clean, modern design with good typography."
              label="Thought for 2s"
              defaultExpanded={false}
            />
          </Message.Bubble>
        </Message>

        {/* Assistant with tool call */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>
                I see the issue - there is no{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-sm">
                  app/page.tsx
                </code>{' '}
                file yet. Let me create a simple page so you can see the color
                changes in the preview:
              </p>
              <ToolCallDisplay
                invocation={createFileTool.completed}
                result={createFileTool.completedResult}
              />
            </div>
          </Message.Bubble>
        </Message>

        {/* Final response */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-2">
              <p>
                I have created a simple home page that showcases the new blue
                color scheme. You should now see the preview with the updated
                primary blue color and light blue accent color displayed in
                sample cards.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <span>No issues found</span>
              </div>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="I have created a simple home page..." />
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
// Conversation with Reasoning
// ============================================

export const ConversationWithReasoning: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <MessageList className="flex-1 p-4">
        {conversationWithReasoning.map((msg) => (
          <Message key={msg.id} role={msg.role}>
            <Message.Avatar
              fallback={msg.role === 'user' ? 'U' : 'AI'}
              src={
                msg.role === 'assistant'
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
                  : undefined
              }
            />
            <Message.Bubble>
              <div className="space-y-3">
                {msg.parts.map((part) => {
                  if (part.type === 'reasoning') {
                    return (
                      <ReasoningDisplay
                        key={part.id}
                        content={part.content}
                        label="Thought for 3s"
                        defaultExpanded={!part.isCollapsed}
                      />
                    );
                  }
                  if (part.type === 'text') {
                    return (
                      <div key={part.id} className="whitespace-pre-wrap">
                        {part.content}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </Message.Bubble>
            {msg.role === 'assistant' && (
              <Message.Actions>
                <CopyButton content={getTextContent(msg)} />
                <RegenerateButton
                  onRegenerate={() => console.log('Regenerate')}
                />
              </Message.Actions>
            )}
          </Message>
        ))}
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
// Full Agent Session
// ============================================

export const FullAgentSession: Story = {
  render: () => (
    <ChatContainer className="h-[700px]">
      <MessageList className="flex-1 p-4">
        {/* Initial user request */}
        <Message role="user">
          <Message.Avatar fallback="U" />
          <Message.Bubble>
            Create a simple todo app with React and TypeScript
          </Message.Bubble>
        </Message>

        {/* Assistant reasoning */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <ReasoningDisplay
              content="Creating a todo app requires:
1. State management for todos
2. Add/remove/toggle functionality
3. Clean UI with proper accessibility
4. TypeScript interfaces for type safety

I'll create a simple but functional implementation."
              label="Thought for 2s"
            />
          </Message.Bubble>
        </Message>

        {/* Creating files */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <p>
                I will create the todo app for you. Let me set up the files:
              </p>
              <ToolCallDisplay
                invocation={{
                  id: '1',
                  type: 'tool_invocation',
                  toolName: 'create_file',
                  toolCallId: 'call_1',
                  args: { path: 'src/components/TodoApp.tsx' },
                  state: 'completed',
                }}
                result={{
                  id: '2',
                  type: 'tool_result',
                  toolCallId: 'call_1',
                  result: { success: true, path: 'src/components/TodoApp.tsx' },
                }}
              />
              <ToolCallDisplay
                invocation={{
                  id: '3',
                  type: 'tool_invocation',
                  toolName: 'create_file',
                  toolCallId: 'call_2',
                  args: { path: 'src/types/todo.ts' },
                  state: 'completed',
                }}
                result={{
                  id: '4',
                  type: 'tool_result',
                  toolCallId: 'call_2',
                  result: { success: true, path: 'src/types/todo.ts' },
                }}
              />
            </div>
          </Message.Bubble>
        </Message>

        {/* Review work */}
        <Message role="assistant">
          <Message.Avatar
            fallback="AI"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          />
          <Message.Bubble>
            <div className="space-y-3">
              <ToolCallDisplay
                invocation={reviewWorkTool.completed}
                result={reviewWorkTool.completedResult}
              />
              <p>
                Done! I have created a simple todo app with the following
                features:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Add new todos</li>
                <li>Mark todos as complete</li>
                <li>Delete todos</li>
                <li>Filter by status (all/active/completed)</li>
              </ul>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Worked for 1m 23s</span>
              </div>
            </div>
          </Message.Bubble>
          <Message.Actions>
            <CopyButton content="Done! I have created a simple todo app..." />
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
// Interactive Typing (Play Function)
// ============================================

export const InteractiveTyping: Story = {
  render: () => (
    <ChatContainer className="h-[600px]">
      <EmptyState
        title="How can I help you today?"
        suggestions={suggestions}
        onSuggestionClick={(s) => console.log('Suggestion clicked:', s.text)}
      />
      <ChatInput onSubmit={(v) => console.log('Submit:', v)}>
        <ChatInput.Textarea placeholder="Ask Lovable..." />
        <ChatInput.Actions>
          <div />
          <ChatInput.SendButton />
        </ChatInput.Actions>
      </ChatInput>
    </ChatContainer>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('User types a message', async () => {
      const textarea = canvas.getByPlaceholderText('Ask Lovable...');
      await userEvent.click(textarea);
      await userEvent.type(textarea, 'Create a landing page for my portfolio', {
        delay: 50,
      });
    });

    await step('Wait before sending', async () => {
      await new Promise((r) => setTimeout(r, 500));
    });
  },
};
