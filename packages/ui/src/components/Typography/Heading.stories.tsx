import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Typography/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['72', '64', '56', '48', '40', '32', '24', '20', '16', '14'],
    },
    variant: {
      control: 'select',
      options: ['default', 'subtle'],
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog',
    size: '24',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading size="72">Heading 72</Heading>
      <Heading size="64">Heading 64</Heading>
      <Heading size="56">Heading 56</Heading>
      <Heading size="48">Heading 48</Heading>
      <Heading size="40">Heading 40</Heading>
      <Heading size="32">Heading 32</Heading>
      <Heading size="24">Heading 24</Heading>
      <Heading size="20">Heading 20</Heading>
      <Heading size="16">Heading 16</Heading>
      <Heading size="14">Heading 14</Heading>
    </div>
  ),
};

export const Subtle: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading size="32" variant="default">
        Default Heading
      </Heading>
      <Heading size="32" variant="subtle">
        Subtle Heading
      </Heading>
    </div>
  ),
};

export const SemanticLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading size="48" as="h1">
        Custom h1 with size 48
      </Heading>
      <Heading size="24" as="h2">
        Custom h2 with size 24
      </Heading>
      <Heading size="16" as="h3">
        Custom h3 with size 16
      </Heading>
    </div>
  ),
};
