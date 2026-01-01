import type { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';
import { Text } from './Text';

const meta: Meta<typeof Code> = {
  title: 'Design System/Typography/Code',
  component: Code,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['14', '13', '12'],
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Default: Story = {
  args: {
    children: 'npm install @agent-kit/ui',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Code size="14">Code size 14</Code>
      </div>
      <div>
        <Code size="13">Code size 13</Code>
      </div>
      <div>
        <Code size="12">Code size 12</Code>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Code variant="default">Default with background</Code>
      </div>
      <div>
        <Code variant="ghost">Ghost without background</Code>
      </div>
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <Text>
      Run <Code>bun install</Code> to install dependencies, then{' '}
      <Code>bun run dev</Code> to start the development server.
    </Text>
  ),
};

export const CodeExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <Text>
        Import the component:{' '}
        <Code>import {'{ Button }'} from &apos;@agent-kit/ui&apos;</Code>
      </Text>
      <Text>
        Environment variable: <Code>NEXT_PUBLIC_API_URL</Code>
      </Text>
      <Text>
        File path: <Code>packages/ui/src/components</Code>
      </Text>
    </div>
  ),
};
