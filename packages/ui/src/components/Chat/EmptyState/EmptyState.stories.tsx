import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Chat/States/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {},
};

export const WithDescription: Story = {
  args: {
    title: 'Welcome to AI Assistant',
    description:
      'I can help you with coding, writing, analysis, and much more. Just ask me anything!',
  },
};

export const WithSuggestions: Story = {
  args: {
    title: 'How can I help you today?',
    suggestions: [
      {
        id: '1',
        text: 'Help me write code',
        prompt: 'Write a function that...',
      },
      { id: '2', text: 'Explain a concept', prompt: 'Explain how...' },
      { id: '3', text: 'Debug my code', prompt: 'Fix the bug in...' },
      { id: '4', text: 'Generate content', prompt: 'Create a...' },
    ],
    onSuggestionClick: (suggestion) => console.log('Clicked:', suggestion),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Start a conversation',
    description: 'Ask me anything and I will do my best to help.',
    icon: (
      <svg
        className="h-16 w-16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
};
