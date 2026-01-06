import type { Meta, StoryObj } from '@storybook/react';
import { ContextIndicator } from './ContextIndicator';

const meta: Meta<typeof ContextIndicator> = {
  title: 'Chat/Chat Components/ContextIndicator',
  component: ContextIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    warningThreshold: {
      control: { type: 'number', min: 50, max: 100 },
      description: 'Percentage at which to show warning color',
    },
    dangerThreshold: {
      control: { type: 'number', min: 50, max: 100 },
      description: 'Percentage at which to show danger color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContextIndicator>;

export const Default: Story = {
  args: {
    usage: {
      used: 15000,
      total: 200000,
      percentage: 7.5,
    },
  },
};

export const Empty: Story = {
  args: {
    usage: {
      used: 0,
      total: 200000,
      percentage: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state when no context usage data is available yet.',
      },
    },
  },
};

export const WithCost: Story = {
  args: {
    usage: {
      used: 25000,
      total: 200000,
      percentage: 12.5,
      promptTokens: 10000,
      completionTokens: 15000,
      estimatedCost: 0.0375,
    },
  },
};

export const WithTokenBreakdown: Story = {
  args: {
    usage: {
      used: 50000,
      total: 200000,
      percentage: 25,
      promptTokens: 30000,
      completionTokens: 20000,
    },
  },
};

export const HighCost: Story = {
  args: {
    usage: {
      used: 150000,
      total: 200000,
      percentage: 75,
      promptTokens: 100000,
      completionTokens: 50000,
      estimatedCost: 2.5,
    },
  },
};

export const Warning: Story = {
  args: {
    usage: {
      used: 160000,
      total: 200000,
      percentage: 80,
      promptTokens: 100000,
      completionTokens: 60000,
      estimatedCost: 1.25,
    },
  },
};

export const Danger: Story = {
  args: {
    usage: {
      used: 185000,
      total: 200000,
      percentage: 92.5,
      promptTokens: 120000,
      completionTokens: 65000,
      estimatedCost: 3.75,
    },
  },
};

export const LargeTokenCounts: Story = {
  args: {
    usage: {
      used: 1500000,
      total: 2000000,
      percentage: 75,
      promptTokens: 1000000,
      completionTokens: 500000,
      estimatedCost: 15.5,
    },
  },
};

export const SmallCost: Story = {
  args: {
    usage: {
      used: 500,
      total: 200000,
      percentage: 0.25,
      promptTokens: 200,
      completionTokens: 300,
      estimatedCost: 0.0005,
    },
  },
};
