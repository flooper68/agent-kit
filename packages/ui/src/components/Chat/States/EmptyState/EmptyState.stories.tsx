import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmptyState } from './EmptyState';
import { ChatInput } from '../../Core/ChatInput';
import { AttachmentButton } from '../../Controls/AttachmentButton';
import { SettingsButton } from '../../Controls/SettingsButton';
import { ModelSwitcher } from '../../Controls/ModelSwitcher';
import type { ModelOption } from '../../../../types/chat';

const meta: Meta<typeof EmptyState> = {
  title: 'Chat/Chat Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

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
  args: {},
};

export const WithInput: Story = {
  render: function WithInputStory() {
    const [model, setModel] = useState('gpt-4');

    return (
      <EmptyState
        title="How can I help you today?"
        inputElement={
          <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
            <ChatInput.Textarea placeholder="Ask the agent..." />
            <ChatInput.Actions>
              <div className="flex items-center gap-1">
                <AttachmentButton
                  onAttach={(files) => console.log('Files:', files)}
                  showMenu={false}
                />
                <SettingsButton
                  onClick={() => console.log('Settings clicked')}
                />
                <ModelSwitcher
                  models={sampleModels}
                  value={model}
                  onChange={setModel}
                />
              </div>
            </ChatInput.Actions>
          </ChatInput>
        }
      />
    );
  },
};

export const WithSuggestions: Story = {
  render: function WithSuggestionsStory() {
    const [model, setModel] = useState('gpt-4');

    return (
      <EmptyState
        title="How can I help you today?"
        suggestions={[
          {
            id: '1',
            text: 'Help me write code',
            prompt: 'Write a function that...',
          },
          { id: '2', text: 'Explain a concept', prompt: 'Explain how...' },
          { id: '3', text: 'Debug my code', prompt: 'Fix the bug in...' },
          { id: '4', text: 'Generate content', prompt: 'Create a...' },
        ]}
        onSuggestionClick={(suggestion) => console.log('Clicked:', suggestion)}
        inputElement={
          <ChatInput onSubmit={(value) => console.log('Submitted:', value)}>
            <ChatInput.Textarea placeholder="Ask the agent..." />
            <ChatInput.Actions>
              <div className="flex items-center gap-1">
                <AttachmentButton
                  onAttach={(files) => console.log('Files:', files)}
                  showMenu={false}
                />
                <SettingsButton
                  onClick={() => console.log('Settings clicked')}
                />
                <ModelSwitcher
                  models={sampleModels}
                  value={model}
                  onChange={setModel}
                />
              </div>
            </ChatInput.Actions>
          </ChatInput>
        }
      />
    );
  },
};
