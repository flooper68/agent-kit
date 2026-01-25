import type { Meta, StoryObj } from '@storybook/react';
import { TagBadge, type TagColorPreset } from './TagBadge';

const meta: Meta<typeof TagBadge> = {
  title: 'Components/TagBadge',
  component: TagBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A pill-shaped badge component for displaying tags with optional removal functionality.',
      },
    },
  },
  argTypes: {
    color: {
      control: 'select',
      options: [
        'gray',
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'blue',
        'purple',
        'pink',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    removable: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagBadge>;

const allColors: TagColorPreset[] = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
];

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {allColors.map((color) => (
        <TagBadge key={color} label={color} color={color} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Small</span>
        <TagBadge label="Small tag" size="sm" color="blue" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Medium</span>
        <TagBadge label="Medium tag" size="md" color="blue" />
      </div>
    </div>
  ),
};

export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {allColors.map((color) => (
        <TagBadge
          key={color}
          label={color}
          color={color}
          removable
          onRemove={() => console.log(`Removed: ${color}`)}
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <TagBadge label="Disabled" color="blue" disabled />
      <TagBadge
        label="Disabled removable"
        color="green"
        removable
        disabled
        onRemove={() => {}}
      />
    </div>
  ),
};

export const TagList: Story = {
  render: () => (
    <div className="max-w-md rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-medium">Document Tags</h3>
      <div className="flex flex-wrap gap-2">
        <TagBadge label="documentation" color="blue" />
        <TagBadge label="api" color="purple" />
        <TagBadge label="important" color="red" />
        <TagBadge label="draft" color="yellow" />
        <TagBadge label="reviewed" color="green" />
      </div>
    </div>
  ),
};

export const Default: Story = {
  args: {
    label: 'example-tag',
    color: 'blue',
    size: 'sm',
  },
};

export const RemovableDefault: Story = {
  args: {
    label: 'removable-tag',
    color: 'green',
    size: 'sm',
    removable: true,
    onRemove: () => console.log('Removed'),
  },
};
