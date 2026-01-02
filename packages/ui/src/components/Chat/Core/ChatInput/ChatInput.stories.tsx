import type { Meta, StoryObj } from '@storybook/react';
import { ChatInput } from './ChatInput';
import { AttachmentButton } from '../../Controls/AttachmentButton';
import { SettingsButton } from '../../Controls/SettingsButton';

const meta: Meta<typeof ChatInput> = {
  title: 'Chat/Chat Components/ChatInput',
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
      <ChatInput.Textarea placeholder="Ask the agent..." />
    </ChatInput>
  ),
};

export const WithToolbar: Story = {
  render: function WithToolbarStory() {
    return (
      <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
        <ChatInput.Textarea placeholder="Ask the agent..." />
        <ChatInput.Actions>
          <div className="flex items-center gap-1">
            <AttachmentButton
              onAttach={(files) => console.log('Files:', files)}
              showMenu={false}
            />
            <SettingsButton onClick={() => console.log('Settings clicked')} />
          </div>
        </ChatInput.Actions>
      </ChatInput>
    );
  },
};

export const WithAttachments: Story = {
  render: () => (
    <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
      <ChatInput.Textarea placeholder="Ask the agent..." />
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
      <ChatInput.Textarea placeholder="Ask the agent..." />
    </ChatInput>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <ChatInput
      value="Hello, how can you help me today?"
      onSubmit={(value) => console.log('Submitted:', value)}
    >
      <ChatInput.Textarea placeholder="Ask the agent..." />
    </ChatInput>
  ),
};
