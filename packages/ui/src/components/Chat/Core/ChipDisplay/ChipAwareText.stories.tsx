import type { Meta, StoryObj } from '@storybook/react';
import { ChipAwareText } from './ChipAwareText';
import { wrapChipPrompt } from '../../utils/slash-commands';

const meta: Meta<typeof ChipAwareText> = {
  title: 'Chat/Core/ChipAwareText',
  component: ChipAwareText,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4 border rounded-lg bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChipAwareText>;

// Helper to create chip markers
const createChip = (key: string, name: string, prompt: string) =>
  wrapChipPrompt({ id: '1', key, name, prompt });

export const PlainText: Story = {
  args: {
    content: 'This is a plain message without any chip markers.',
  },
};

export const SingleChip: Story = {
  args: {
    content: createChip(
      'summarize',
      'Summarize',
      'Please summarize the following content:'
    ),
  },
};

export const ChipWithFollowUpText: Story = {
  args: {
    content: `${createChip(
      'summarize',
      'Summarize',
      'Please summarize the following:'
    )}

This is the content I want summarized. It has multiple paragraphs.

Here is the second paragraph with more details.`,
  },
};

export const MultipleChips: Story = {
  args: {
    content: `${createChip('summarize', 'Summarize', 'Please summarize:')}

${createChip('translate', 'Translate', 'Then translate to Spanish:')}

Please process this document accordingly.`,
  },
};

export const ChipInMiddleOfText: Story = {
  args: {
    content: `Can you help me with this task?

${createChip('code-review', 'Code Review', 'Please review this code:')}

\`\`\`typescript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

Let me know if there are any issues.`,
  },
};

export const WithMarkdown: Story = {
  args: {
    content: `${createChip('explain', 'Explain', 'Please explain in detail:')}

## The Topic

Here are the key points:

1. First important item
2. Second important item
3. Third important item

> This is a blockquote with additional context.

Please make sure to cover **all** the points.`,
  },
};

export const NoMarkdown: Story = {
  args: {
    content: `${createChip('summarize', 'Summarize', 'Please summarize:')}

This is plain text without markdown rendering.`,
    renderMarkdown: false,
  },
};

export const ComplexMessage: Story = {
  args: {
    content: `Hello! I need your help with a few things today.

${createChip('summarize', 'Summarize', 'First, summarize this article:')}

The article discusses the latest advances in machine learning and their applications in healthcare. It covers topics like diagnosis assistance, drug discovery, and patient monitoring.

${createChip('translate', 'Translate', 'Then translate the summary to French:')}

After that, I'd like you to also:

${createChip('proofread', 'Proofread', 'Finally, proofread my response:')}

Thanks for your help!`,
  },
};

export const EmptyChipPrompt: Story = {
  args: {
    content: `${createChip('quick', 'Quick Action', '')}

Just a quick task with an empty prompt.`,
  },
};
