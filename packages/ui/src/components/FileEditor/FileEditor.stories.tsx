import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileEditor } from './FileEditor';

const meta: Meta<typeof FileEditor> = {
  title: 'Components/FileEditor',
  component: FileEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleContent = `# Web Research Skill

This skill teaches agents how to research topics on the web.

## Usage

Use this skill when you need to:
- Find current information about a topic
- Verify facts from multiple sources
- Gather data for analysis

## Examples

\`\`\`typescript
await searchWeb("latest AI developments 2025");
\`\`\`
`;

const longContent = Array(50)
  .fill(null)
  .map(
    (_, i) =>
      `Line ${i + 1}: This is some content to demonstrate scrolling behavior.`
  )
  .join('\n');

function InteractiveFileEditor() {
  const [content, setContent] = useState(sampleContent);

  return (
    <div className="h-[400px] w-[600px]">
      <FileEditor
        path="SKILL.md"
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}

function EmptyFileEditor() {
  const [content, setContent] = useState('');

  return (
    <div className="h-[400px] w-[600px]">
      <FileEditor
        path="references/api.md"
        content={content}
        onContentChange={setContent}
        placeholder="Write your API documentation here..."
      />
    </div>
  );
}

function LongContentEditor() {
  const [content, setContent] = useState(longContent);

  return (
    <div className="h-[400px] w-[600px]">
      <FileEditor
        path="assets/large-file.txt"
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}

function NestedPathEditor() {
  const [content, setContent] = useState(
    '# Nested File\n\nThis file is in a nested folder.'
  );

  return (
    <div className="h-[400px] w-[600px]">
      <FileEditor
        path="references/examples/basic.md"
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveFileEditor />,
};

export const Empty: Story = {
  render: () => <EmptyFileEditor />,
};

export const Disabled: Story = {
  args: {
    path: 'SKILL.md',
    content: sampleContent,
    onContentChange: () => {},
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="h-[400px] w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export const LongContent: Story = {
  render: () => <LongContentEditor />,
};

export const NestedPath: Story = {
  render: () => <NestedPathEditor />,
};
