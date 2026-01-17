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

export const WithTitleAndDescription: Story = {
  args: {
    commandKey: 'summarize',
    title: 'Summarize',
    description: 'Condense content into key points',
    prompt: 'Please summarize the following content in a concise manner:',
  },
};

export const WithLongPrompt: Story = {
  args: {
    commandKey: 'code-review',
    title: 'Code Review',
    description: 'Analyze code for bugs, security issues, and best practices',
    prompt: `You are an expert code reviewer. Please review the following code with attention to:

1. Code correctness and potential bugs
2. Security vulnerabilities (OWASP Top 10)
3. Performance considerations
4. Code style and readability
5. Best practices for the language/framework

Provide specific, actionable feedback with line references where applicable.`,
  },
};

export const TitleOnly: Story = {
  args: {
    commandKey: 'phoenix',
    title: 'Phoenix Agent',
  },
};

export const TitleAndDescription: Story = {
  args: {
    commandKey: 'translate',
    title: 'Translate',
    description:
      'Translate text between languages using AI-powered translation',
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
        title="Summarize"
        description="Condense content into key points"
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
        title="Summarize"
        description="Condense content into key points"
        prompt="Summarize this content:"
      />{' '}
      and then{' '}
      <ChipInlineDisplay
        commandKey="translate"
        title="Translate"
        description="Translate text between languages"
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
