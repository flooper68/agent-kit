import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../../theme';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Primitives/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="flex items-center gap-4 p-4">
          <Story />
          <span className="text-sm text-muted-foreground">
            Click to cycle through themes
          </span>
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  args: {},
};

export const WithoutSystemOption: Story = {
  args: {
    showSystemOption: false,
  },
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    size: 'lg',
  },
};
