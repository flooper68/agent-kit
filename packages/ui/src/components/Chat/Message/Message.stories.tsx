import type { Meta, StoryObj } from '@storybook/react';
import { Message } from './Message';
import { CopyButton } from '../CopyButton';
import { RegenerateButton } from '../ActionButtons';

const meta: Meta<typeof Message> = {
  title: 'Chat/Core/Message',
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
