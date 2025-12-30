import type { Meta, StoryObj } from '@storybook/react';
import { ThinkingIndicator } from './ThinkingIndicator';

const meta: Meta<typeof ThinkingIndicator> = {
  title: 'Chat/AI Features/ThinkingIndicator',
  component: ThinkingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['dots', 'text', 'spinner'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThinkingIndicator>;

export const Dots: Story = {
  args: {
    variant: 'dots',
    status: 'Thinking',
  },
};

export const Spinner: Story = {
  args: {
    variant: 'spinner',
    status: 'Processing',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    status: 'Analyzing',
  },
};

export const WithDetail: Story = {
  args: {
    variant: 'dots',
    status: 'Searching the web',
    detail: 'Finding relevant information...',
  },
};

export const CustomStatus: Story = {
  args: {
    variant: 'spinner',
    status: 'Running code',
    detail: 'Executing Python script',
  },
};
