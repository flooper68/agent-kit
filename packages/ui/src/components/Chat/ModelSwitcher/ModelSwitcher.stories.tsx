import type { Meta, StoryObj } from '@storybook/react';
import { ModelSwitcher } from './ModelSwitcher';
import type { ModelOption } from '../../../types/chat';

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
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Balanced performance and speed',
  },
  {
    id: 'claude-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    description: 'Fast and efficient for simple tasks',
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
