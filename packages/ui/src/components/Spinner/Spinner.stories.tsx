import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['primary', 'muted', 'current'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Primary: Story = {
  args: {
    color: 'primary',
  },
};

export const Muted: Story = {
  args: {
    color: 'muted',
  },
};

export const CurrentColor: Story = {
  args: {
    color: 'current',
  },
  decorators: [
    (Story) => (
      <div className="text-destructive">
        <Story />
      </div>
    ),
  ],
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};
