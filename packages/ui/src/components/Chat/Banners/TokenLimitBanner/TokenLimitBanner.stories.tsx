import type { Meta, StoryObj } from '@storybook/react';
import { TokenLimitBanner } from './TokenLimitBanner';

const meta: Meta<typeof TokenLimitBanner> = {
  title: 'Chat/TokenLimitBanner',
  component: TokenLimitBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['warning', 'error'],
      description: 'Banner variant',
    },
    warningThreshold: {
      control: { type: 'number', min: 50, max: 100 },
      description: 'Percentage at which to show warning',
    },
    onDismiss: { action: 'dismissed' },
  },
};

export default meta;
type Story = StoryObj<typeof TokenLimitBanner>;

export const Warning: Story = {
  args: {
    usage: {
      used: 95000,
      total: 100000,
      percentage: 95,
    },
    warningThreshold: 90,
  },
};

export const AtLimit: Story = {
  args: {
    usage: {
      used: 100000,
      total: 100000,
      percentage: 100,
    },
  },
};

export const Dismissible: Story = {
  args: {
    usage: {
      used: 92000,
      total: 100000,
      percentage: 92,
    },
    onDismiss: () => console.log('Dismissed'),
  },
};

export const CustomThreshold: Story = {
  args: {
    usage: {
      used: 75000,
      total: 100000,
      percentage: 75,
    },
    warningThreshold: 70,
  },
};

export const LargeTokenCounts: Story = {
  args: {
    usage: {
      used: 1850000,
      total: 2000000,
      percentage: 92.5,
    },
  },
};

export const BelowThreshold: Story = {
  args: {
    usage: {
      used: 50000,
      total: 100000,
      percentage: 50,
    },
    warningThreshold: 90,
  },
  render: (args) => (
    <div className="space-y-2">
      <TokenLimitBanner {...args} />
      <p className="text-sm text-muted-foreground">
        Banner not visible because usage (50%) is below threshold (90%)
      </p>
    </div>
  ),
};

export const ForceWarningVariant: Story = {
  args: {
    usage: {
      used: 100000,
      total: 100000,
      percentage: 100,
    },
    variant: 'warning',
  },
};
