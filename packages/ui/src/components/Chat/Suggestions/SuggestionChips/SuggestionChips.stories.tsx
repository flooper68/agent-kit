import type { Meta, StoryObj } from '@storybook/react';
import { SuggestionChips } from './SuggestionChips';
import type { SuggestionChip } from '../../../../types/chat';

const defaultSuggestions: SuggestionChip[] = [
  {
    id: '1',
    text: 'Explain this code',
    prompt: 'Can you explain what this code does?',
  },
  {
    id: '2',
    text: 'Find bugs',
    prompt: 'Can you identify any bugs or issues?',
  },
  {
    id: '3',
    text: 'Optimize performance',
    prompt: 'How can I optimize this for better performance?',
  },
  {
    id: '4',
    text: 'Add tests',
    prompt: 'Can you help me write tests for this?',
  },
];

const meta: Meta<typeof SuggestionChips> = {
  title: 'Chat/Chat Components/SuggestionChips',
  component: SuggestionChips,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    layout: {
      control: 'select',
      options: ['horizontal', 'grid'],
      description: 'Layout of the suggestion chips',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size of the chips',
    },
    onSuggestionClick: { action: 'suggestionClicked' },
  },
};

export default meta;
type Story = StoryObj<typeof SuggestionChips>;

export const Default: Story = {
  args: {
    suggestions: defaultSuggestions,
    layout: 'horizontal',
    size: 'md',
  },
};

export const Horizontal: Story = {
  args: {
    suggestions: defaultSuggestions,
    layout: 'horizontal',
  },
};

export const Grid: Story = {
  args: {
    suggestions: defaultSuggestions,
    layout: 'grid',
  },
};

export const Small: Story = {
  args: {
    suggestions: defaultSuggestions,
    layout: 'horizontal',
    size: 'sm',
  },
};

export const FewSuggestions: Story = {
  args: {
    suggestions: defaultSuggestions.slice(0, 2),
    layout: 'horizontal',
  },
};

export const ManySuggestions: Story = {
  args: {
    suggestions: [
      ...defaultSuggestions,
      { id: '5', text: 'Refactor code', prompt: 'Can you help refactor this?' },
      {
        id: '6',
        text: 'Add documentation',
        prompt: 'Can you add documentation?',
      },
      {
        id: '7',
        text: 'Convert to TypeScript',
        prompt: 'Can you convert this to TypeScript?',
      },
      {
        id: '8',
        text: 'Review security',
        prompt: 'Can you review for security issues?',
      },
    ],
    layout: 'horizontal',
  },
};

export const GridSmall: Story = {
  args: {
    suggestions: defaultSuggestions,
    layout: 'grid',
    size: 'sm',
  },
};

export const LongText: Story = {
  args: {
    suggestions: [
      {
        id: '1',
        text: 'This is a very long suggestion text that might wrap',
        prompt: 'Long prompt',
      },
      {
        id: '2',
        text: 'Another long suggestion for testing layout',
        prompt: 'Another prompt',
      },
    ],
    layout: 'horizontal',
  },
};
