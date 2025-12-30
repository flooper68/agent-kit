import type { Meta, StoryObj } from '@storybook/react';
import { ChatInput } from './ChatInput';
import { AttachmentButton } from '../../Controls/AttachmentButton';

const meta: Meta<typeof ChatInput> = {
  title: 'Chat/Core/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Default: Story = {
  render: () => (
    <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
      <ChatInput.Textarea placeholder="Type a message... (Press Enter to send)" />
    </ChatInput>
  ),
};

export const WithAttachments: Story = {
  render: () => (
    <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
      <ChatInput.Textarea placeholder="Type a message... (Press Enter to send)" />
      <ChatInput.Actions>
        <AttachmentButton onAttach={(files) => console.log('Files:', files)} />
      </ChatInput.Actions>
    </ChatInput>
  ),
};

export const Submitting: Story = {
  render: () => (
    <ChatInput
      isSubmitting
      onSubmit={(value) => console.log('Submitted:', value)}
    >
      <ChatInput.Textarea placeholder="Type a message... (Press Enter to send)" />
    </ChatInput>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <ChatInput
      value="Hello, how can you help me today?"
      onSubmit={(value) => console.log('Submitted:', value)}
    >
      <ChatInput.Textarea placeholder="Type a message... (Press Enter to send)" />
    </ChatInput>
  ),
};
