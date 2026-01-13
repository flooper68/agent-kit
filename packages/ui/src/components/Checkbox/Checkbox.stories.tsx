import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A checkbox component for selecting options. Supports labels, sizes, and disabled states.
Uses the info color (blue) when checked.
        `,
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to the checkbox',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const WithLabel: Story = {
  args: {
    checked: false,
    label: 'Accept terms and conditions',
  },
};

export const CheckedWithLabel: Story = {
  args: {
    checked: true,
    label: 'Use academic sources only',
  },
};

export const SmallSize: Story = {
  args: {
    checked: true,
    label: 'Small checkbox',
    size: 'sm',
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    label: 'Disabled checked checkbox',
    disabled: true,
  },
};

// Interactive demo with state
const InteractiveDemo = () => {
  const [items, setItems] = useState([
    { id: '1', label: 'Use academic sources only', checked: true },
    { id: '2', label: 'Include citations', checked: false },
    { id: '3', label: 'Summarize findings', checked: true },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="space-y-3 p-4 bg-background border rounded-lg max-w-sm">
      <p className="text-sm font-medium">Select options:</p>
      {items.map((item) => (
        <Checkbox
          key={item.id}
          checked={item.checked}
          onChange={() => toggleItem(item.id)}
          label={item.label}
        />
      ))}
      <p className="text-xs text-muted-foreground pt-2 border-t">
        Selected: {items.filter((i) => i.checked).length} / {items.length}
      </p>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing multiple checkboxes with state management.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Checkbox checked size="sm" label="Small (sm)" />
        <Checkbox checked size="md" label="Medium (md)" />
      </div>
    </div>
  ),
};
