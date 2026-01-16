import type { Meta, StoryObj } from '@storybook/react';
import { Message } from './Message';
import { CopyButton } from '../../Controls/CopyButton';
import { RegenerateButton } from '../../Controls/ActionButtons';
import { ChipAwareText } from '../ChipDisplay';
import { wrapChipPrompt } from '../../utils/slash-commands';

const meta: Meta<typeof Message> = {
  title: 'Chat/Chat Components/Message',
  component: Message,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Message>;

export const UserMessage: Story = {
  render: () => (
    <Message role="user">
      <Message.Avatar fallback="U" />
      <Message.Bubble>
        Hello! Can you help me understand how to use React hooks?
      </Message.Bubble>
    </Message>
  ),
};

export const AssistantMessage: Story = {
  render: () => (
    <Message role="assistant">
      <Message.Avatar fallback="AI" />
      <Message.Bubble>
        Of course! React hooks are functions that let you use state and other
        React features in functional components. The most common hooks are
        useState for managing state and useEffect for side effects.
      </Message.Bubble>
    </Message>
  ),
};

export const SystemMessage: Story = {
  render: () => (
    <Message role="system">
      <Message.Bubble>Conversation started</Message.Bubble>
    </Message>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Message role="assistant">
      <Message.Avatar fallback="AI" />
      <Message.Bubble>
        Here is my response with action buttons that appear on hover.
      </Message.Bubble>
      <Message.Actions>
        <CopyButton content="Here is my response with action buttons that appear on hover." />
        <RegenerateButton />
      </Message.Actions>
    </Message>
  ),
};

export const Conversation: Story = {
  render: () => (
    <div className="space-y-4">
      <Message role="user">
        <Message.Avatar fallback="U" />
        <Message.Bubble>What is TypeScript?</Message.Bubble>
      </Message>
      <Message role="assistant">
        <Message.Avatar fallback="AI" />
        <Message.Bubble>
          TypeScript is a strongly typed programming language that builds on
          JavaScript. It adds optional static typing and class-based
          object-oriented programming to the language.
        </Message.Bubble>
      </Message>
      <Message role="user">
        <Message.Avatar fallback="U" />
        <Message.Bubble>How do I install it?</Message.Bubble>
      </Message>
      <Message role="assistant">
        <Message.Avatar fallback="AI" />
        <Message.Bubble>
          You can install TypeScript globally using npm: `npm install -g
          typescript`. Then you can compile TypeScript files using the `tsc`
          command.
        </Message.Bubble>
      </Message>
    </div>
  ),
};

// Helper to create chip markers
const createChip = (key: string, name: string, prompt: string) =>
  wrapChipPrompt({ id: '1', key, name, prompt });

export const UserMessageWithChip: Story = {
  render: () => (
    <Message role="user">
      <Message.Avatar fallback="U" />
      <Message.Bubble>
        <ChipAwareText
          content={`${createChip('summarize', 'Summarize', 'Please summarize the following:')}

This is a long article about machine learning that I need summarized.`}
        />
      </Message.Bubble>
    </Message>
  ),
};

export const UserMessageWithMultipleChips: Story = {
  render: () => (
    <Message role="user">
      <Message.Avatar fallback="U" />
      <Message.Bubble>
        <ChipAwareText
          content={`${createChip('summarize', 'Summarize', 'First, summarize this:')}

${createChip('translate', 'Translate', 'Then translate to Spanish:')}

Here is the document content that needs processing.`}
        />
      </Message.Bubble>
    </Message>
  ),
};

export const ConversationWithChips: Story = {
  render: () => (
    <div className="space-y-4">
      <Message role="user">
        <Message.Avatar fallback="U" />
        <Message.Bubble>
          <ChipAwareText
            content={`${createChip('explain', 'Explain', 'Please explain in simple terms:')}

What is quantum computing and how does it differ from classical computing?`}
          />
        </Message.Bubble>
      </Message>
      <Message role="assistant">
        <Message.Avatar fallback="AI" />
        <Message.Bubble>
          Quantum computing uses quantum bits (qubits) that can exist in
          multiple states simultaneously, unlike classical bits that are either
          0 or 1. This allows quantum computers to process many possibilities at
          once, making them powerful for specific problems like cryptography and
          optimization.
        </Message.Bubble>
      </Message>
      <Message role="user">
        <Message.Avatar fallback="U" />
        <Message.Bubble>
          <ChipAwareText
            content={`${createChip('code-example', 'Code Example', 'Show me a code example:')}

Can you show me a simple quantum circuit?`}
          />
        </Message.Bubble>
      </Message>
    </div>
  ),
};
