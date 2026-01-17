import type { Meta, StoryObj } from '@storybook/react';
import { ChipInlineDisplay } from './ChipInlineDisplay';

const meta: Meta<typeof ChipInlineDisplay> = {
  title: 'Chat/Core/ChipInlineDisplay',
  component: ChipInlineDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChipInlineDisplay>;

export const Default: Story = {
  args: {
    commandKey: 'summarize',
  },
};

export const WithPrompt: Story = {
  args: {
    commandKey: 'summarize',
    prompt: 'Please summarize the following content in a concise manner:',
  },
};

export const ReviewCommand: Story = {
  args: {
    commandKey: 'review-current',
    prompt: 'Review the current changes with the team:',
  },
};

export const PhoenixCommand: Story = {
  args: {
    commandKey: 'phoenix',
    prompt: 'Use the Phoenix agent to process this:',
  },
};

export const PrepareCommitCommand: Story = {
  args: {
    commandKey: 'prepare-commit-message',
    prompt: 'Prepare a commit message for these changes:',
  },
};

export const CodeReviewCommand: Story = {
  args: {
    commandKey: 'code-review',
    prompt:
      'Please review this code for best practices, bugs, and improvements:',
  },
};

export const InlineWithText: Story = {
  render: () => (
    <p className="text-sm">
      Can you{' '}
      <ChipInlineDisplay
        commandKey="summarize"
        prompt="Please summarize the following:"
      />{' '}
      this article for me?
    </p>
  ),
};

export const MultipleChipsInText: Story = {
  render: () => (
    <p className="text-sm">
      Please{' '}
      <ChipInlineDisplay
        commandKey="summarize"
        prompt="Summarize this content:"
      />{' '}
      and then{' '}
      <ChipInlineDisplay
        commandKey="translate"
        prompt="Translate to Spanish:"
      />{' '}
      the result.
    </p>
  ),
};

export const LongCommandKey: Story = {
  args: {
    commandKey: 'prepare-commit-message',
  },
};
