import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    sideOffset: {
      control: 'number',
    },
    delayDuration: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const Top: Story = {
  render: () => (
    <Tooltip content="Tooltip on top" side="top">
      <Button variant="outline">Top</Button>
    </Tooltip>
  ),
};

export const Right: Story = {
  render: () => (
    <Tooltip content="Tooltip on right" side="right">
      <Button variant="outline">Right</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Tooltip content="Tooltip on bottom" side="bottom">
      <Button variant="outline">Bottom</Button>
    </Tooltip>
  ),
};

export const Left: Story = {
  render: () => (
    <Tooltip content="Tooltip on left" side="left">
      <Button variant="outline">Left</Button>
    </Tooltip>
  ),
};

export const AllPositions: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-8 p-12">
      <Tooltip content="Top tooltip" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
    </div>
  ),
};

export const CustomDelay: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="No delay (0ms)" delayDuration={0}>
        <Button variant="outline">Instant</Button>
      </Tooltip>
      <Tooltip content="Default delay (200ms)" delayDuration={200}>
        <Button variant="outline">Default</Button>
      </Tooltip>
      <Tooltip content="Slow delay (500ms)" delayDuration={500}>
        <Button variant="outline">Slow</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Customize the delay before the tooltip appears.',
      },
    },
  },
};

export const WithRichContent: Story = {
  render: () => (
    <Tooltip
      content={
        <div className="text-center">
          <div className="font-semibold">Keyboard shortcut</div>
          <div className="text-primary-foreground/80">⌘ + K</div>
        </div>
      }
    >
      <Button variant="outline">Rich content</Button>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltip content can be any React node, not just text.',
      },
    },
  },
};

export const LongContent: Story = {
  render: () => (
    <Tooltip content="This is a longer tooltip message that provides more detailed information about what this button does when clicked.">
      <Button variant="outline">Long tooltip</Button>
    </Tooltip>
  ),
};

const ControlledTooltip = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <Tooltip content="Controlled tooltip" open={open} onOpenChange={setOpen}>
        <Button variant="outline">Controlled</Button>
      </Tooltip>
      <Button variant="secondary" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} Tooltip
      </Button>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledTooltip />,
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip can be controlled programmatically using open and onOpenChange props.',
      },
    },
  },
};

export const CustomOffset: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Tooltip content="Close (4px)" sideOffset={4}>
        <Button variant="outline">Close</Button>
      </Tooltip>
      <Tooltip content="Default (4px)" sideOffset={4}>
        <Button variant="outline">Default</Button>
      </Tooltip>
      <Tooltip content="Far (12px)" sideOffset={12}>
        <Button variant="outline">Far</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Adjust the distance between the tooltip and the trigger element.',
      },
    },
  },
};
