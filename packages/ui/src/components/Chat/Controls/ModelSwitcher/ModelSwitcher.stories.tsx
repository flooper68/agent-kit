import type { Meta, StoryObj } from '@storybook/react';
import { ModelSwitcher } from './ModelSwitcher';
import type { ModelOption } from '../../../../types/chat';

const meta: Meta<typeof ModelSwitcher> = {
  title: 'Chat/Controls/ModelSwitcher',
  component: ModelSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ModelSwitcher>;

const models: ModelOption[] = [
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Balanced performance and speed',
  },
  {
    id: 'claude-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    description: 'Fast and efficient for simple tasks',
  },
];

const multiProviderModels: ModelOption[] = [
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Latest OpenAI model',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    description: 'Google AI model',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    description: 'Powerful open-weight model',
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    description: 'Enterprise-grade model',
  },
  {
    id: 'llama-3',
    name: 'Llama 3.1',
    provider: 'meta',
    description: 'Open source model',
  },
];

export const Default: Story = {
  args: {
    models,
    value: 'claude-opus',
    onChange: (modelId) => console.log('Selected:', modelId),
  },
};

export const Disabled: Story = {
  args: {
    models,
    value: 'claude-opus',
    disabled: true,
  },
};

export const MultiProvider: Story = {
  args: {
    models: multiProviderModels,
    value: 'claude-opus',
    onChange: (modelId) => console.log('Selected:', modelId),
  },
};
