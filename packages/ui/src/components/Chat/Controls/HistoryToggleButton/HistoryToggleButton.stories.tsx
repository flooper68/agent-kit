import type { Meta, StoryObj } from '@storybook/react';
import { HistoryToggleButton } from './HistoryToggleButton';

const meta: Meta<typeof HistoryToggleButton> = {
  title: 'Chat/Controls/HistoryToggleButton',
  component: HistoryToggleButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof HistoryToggleButton>;

export const Default: Story = {
  args: {
    onClick: () => console.log('Toggle history'),
  },
};

export const CustomTooltip: Story = {
  args: {
    tooltip: 'View past conversations',
    onClick: () => console.log('Toggle history'),
  },
};
