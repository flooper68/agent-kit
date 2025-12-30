import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Typography/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['20', '16', '14', '13', '12'],
    },
    variant: {
      control: 'select',
      options: ['default', 'strong', 'muted'],
    },
    mono: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Form Label',
    size: '14',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label size="20">Label 20</Label>
      </div>
      <div>
        <Label size="16">Label 16</Label>
      </div>
      <div>
        <Label size="14">Label 14</Label>
      </div>
      <div>
        <Label size="13">Label 13</Label>
      </div>
      <div>
        <Label size="12">Label 12</Label>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label variant="default">Default Label</Label>
      </div>
      <div>
        <Label variant="strong">Strong Label</Label>
      </div>
      <div>
        <Label variant="muted">Muted Label</Label>
      </div>
    </div>
  ),
};

export const Monospace: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label>Regular: API_KEY</Label>
      </div>
      <div>
        <Label mono>Monospace: API_KEY</Label>
      </div>
    </div>
  ),
};

export const WithFormField: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <input
        id="email"
        type="email"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="you@example.com"
      />
      <Label size="12" variant="muted">
        We&apos;ll never share your email.
      </Label>
    </div>
  ),
};
