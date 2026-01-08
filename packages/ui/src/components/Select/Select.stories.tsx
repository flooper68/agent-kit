import type { Meta, StoryObj } from '@storybook/react';
import { Circle, Square, Triangle, Star } from 'lucide-react';
import { Select } from './Select';

const sampleOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
];

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error'],
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    options: sampleOptions,
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    options: sampleOptions,
  },
};

export const WithPlaceholder: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Select a fruit...',
    defaultValue: '',
  },
};

export const Error: Story = {
  args: {
    options: sampleOptions,
    variant: 'error',
  },
};

export const Disabled: Story = {
  args: {
    options: sampleOptions,
    disabled: true,
  },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
      { value: 'cherry', label: 'Cherry' },
    ],
    placeholder: 'Select a fruit...',
    defaultValue: '',
  },
};

export const InForm: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Fruit</label>
        <Select options={sampleOptions} placeholder="Select a fruit..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Category (Error)</label>
        <Select
          options={sampleOptions}
          variant="error"
          placeholder="Select a category..."
        />
        <p className="text-sm text-destructive">This field is required</p>
      </div>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Loading options...',
    isLoading: true,
  },
};

export const WithIcons: Story = {
  args: {
    options: [
      {
        value: 'circle',
        label: 'Circle',
        icon: <Circle className="h-4 w-4" />,
      },
      {
        value: 'square',
        label: 'Square',
        icon: <Square className="h-4 w-4" />,
      },
      {
        value: 'triangle',
        label: 'Triangle',
        icon: <Triangle className="h-4 w-4" />,
      },
      { value: 'star', label: 'Star', icon: <Star className="h-4 w-4" /> },
    ],
    placeholder: 'Select a shape...',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Default
        </label>
        <Select options={sampleOptions} placeholder="Select a fruit..." />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Loading
        </label>
        <Select options={sampleOptions} placeholder="Loading..." isLoading />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Disabled
        </label>
        <Select options={sampleOptions} placeholder="Disabled..." disabled />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Error
        </label>
        <Select
          options={sampleOptions}
          placeholder="Error state..."
          variant="error"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          With Icons
        </label>
        <Select
          options={[
            {
              value: 'circle',
              label: 'Circle',
              icon: <Circle className="h-4 w-4" />,
            },
            {
              value: 'square',
              label: 'Square',
              icon: <Square className="h-4 w-4" />,
            },
          ]}
          placeholder="Select a shape..."
        />
      </div>
    </div>
  ),
};
