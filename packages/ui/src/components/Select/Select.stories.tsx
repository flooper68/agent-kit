import type { Meta, StoryObj } from '@storybook/react';
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
