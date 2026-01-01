import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Design System/Typography/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['24', '20', '16', '14', '13'],
    },
    variant: {
      control: 'select',
      options: ['default', 'strong', 'muted'],
    },
    mono: {
      control: 'boolean',
    },
    as: {
      control: 'select',
      options: ['p', 'span', 'div'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children:
      'The quick brown fox jumps over the lazy dog. This is body text designed for longer passages and paragraphs.',
    size: '14',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Text size="24">Copy 24 - Large body text for emphasis</Text>
      <Text size="20">Copy 20 - Medium-large body text</Text>
      <Text size="16">Copy 16 - Standard body text</Text>
      <Text size="14">Copy 14 - Default body text size</Text>
      <Text size="13">Copy 13 - Small body text</Text>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="default">Default text styling</Text>
      <Text variant="strong">Strong text for emphasis</Text>
      <Text variant="muted">Muted text for secondary content</Text>
    </div>
  ),
};

export const Monospace: Story = {
  render: () => (
    <div className="space-y-4">
      <Text>Regular text: function example() {}</Text>
      <Text mono>Monospace text: function example() {}</Text>
    </div>
  ),
};

export const AsSpan: Story = {
  render: () => (
    <p>
      This is a paragraph with{' '}
      <Text as="span" variant="strong">
        inline strong text
      </Text>{' '}
      and{' '}
      <Text as="span" variant="muted">
        muted text
      </Text>{' '}
      mixed in.
    </p>
  ),
};
