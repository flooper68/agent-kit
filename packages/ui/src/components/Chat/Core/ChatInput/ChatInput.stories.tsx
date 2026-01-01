import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChatInput } from './ChatInput';
import { AttachmentButton } from '../../Controls/AttachmentButton';
import { SettingsButton } from '../../Controls/SettingsButton';
import { ModelSwitcher } from '../../Controls/ModelSwitcher';
import type { ModelOption } from '../../../../types/chat';

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

const sampleModels: ModelOption[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Most capable model',
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'anthropic',
    description: 'Latest Claude model',
  },
];

export const Default: Story = {
  render: () => (
    <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
      <ChatInput.Textarea placeholder="Ask the agent..." />
    </ChatInput>
  ),
};

export const WithToolbar: Story = {
  render: function WithToolbarStory() {
    const [model, setModel] = useState('gpt-4');

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
            <ModelSwitcher
              models={sampleModels}
              value={model}
              onChange={setModel}
            />
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
