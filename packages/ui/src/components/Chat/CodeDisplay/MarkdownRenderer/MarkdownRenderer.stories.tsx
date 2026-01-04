import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownRenderer } from './MarkdownRenderer';

const meta: Meta<typeof MarkdownRenderer> = {
  title: 'Chat/Chat Components/MarkdownRenderer',
  component: MarkdownRenderer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

export const Default: Story = {
  args: {
    content: `# Hello World

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3
`,
  },
};

export const InlineCode: Story = {
  args: {
    content:
      'Use the `console.log()` function to debug. You can also use `npm install` to install packages.',
  },
};

export const CodeBlock: Story = {
  args: {
    content: `Here's a code example:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`
`,
  },
};

export const ASCIIArt: Story = {
  args: {
    content: `Here's an ASCII diagram:

\`\`\`
┌─────────────────────────────────────┐
│           Architecture              │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────┐     ┌─────────┐       │
│   │  Client │────▶│  Server │       │
│   └─────────┘     └────┬────┘       │
│                        │            │
│                        ▼            │
│                  ┌──────────┐       │
│                  │ Database │       │
│                  └──────────┘       │
│                                     │
└─────────────────────────────────────┘
\`\`\`
`,
  },
};

export const ASCIIFlowchart: Story = {
  args: {
    content: `Decision flowchart:

\`\`\`
        ┌───────────┐
        │   Start   │
        └─────┬─────┘
              │
              ▼
        ┌───────────┐
        │  Is it    │
        │  working? │
        └─────┬─────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
   ┌──────┐     ┌──────┐
   │  Yes │     │  No  │
   └───┬──┘     └───┬──┘
       │            │
       ▼            ▼
   ┌──────┐    ┌────────┐
   │ Done │    │ Fix it │
   └──────┘    └────────┘
\`\`\`
`,
  },
};

export const ASCIITable: Story = {
  args: {
    content: `ASCII table:

\`\`\`
+------------+----------+----------+
| Name       | Age      | City     |
+------------+----------+----------+
| Alice      | 30       | NYC      |
| Bob        | 25       | LA       |
| Charlie    | 35       | Chicago  |
+------------+----------+----------+
\`\`\`
`,
  },
};

export const MixedContent: Story = {
  args: {
    content: `# Mixed Content Example

This paragraph has \`inline code\` mixed with regular text.

## Code Block

\`\`\`javascript
const add = (a, b) => a + b;
console.log(add(2, 3)); // 5
\`\`\`

## ASCII Diagram

\`\`\`
    +---+     +---+     +---+
    | A |---->| B |---->| C |
    +---+     +---+     +---+
\`\`\`

And more \`inline code\` after the diagram.
`,
  },
};

export const MermaidDiagram: Story = {
  args: {
    content: `# System Architecture

Here's the flow of data through our system:

\`\`\`mermaid
flowchart LR
    A[User] --> B[Web App]
    B --> C[API Server]
    C --> D[(Database)]
    C --> E[Cache]
\`\`\`

And here's the sequence of operations:

\`\`\`mermaid
sequenceDiagram
    User->>+WebApp: Click button
    WebApp->>+API: POST /action
    API->>+DB: Insert record
    DB-->>-API: Success
    API-->>-WebApp: 200 OK
    WebApp-->>-User: Show success
\`\`\`
`,
  },
};
