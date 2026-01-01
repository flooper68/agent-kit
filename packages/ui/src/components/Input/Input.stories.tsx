import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    id: 'input-with-label',
    label: 'Email',
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

export const WithError: Story = {
  args: {
    id: 'input-with-error',
    label: 'Email',
    placeholder: 'Enter your email...',
    type: 'email',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    placeholder: 'Cannot edit...',
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    id: 'password-input',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password...',
  },
};

export const InForm: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <Input
        id="form-email"
        label="Email"
        type="email"
        placeholder="Enter your email..."
      />
      <Input
        id="form-password"
        label="Password"
        type="password"
        placeholder="Enter your password..."
      />
      <Input
        id="form-error"
        label="Username"
        placeholder="Enter your username..."
        error="Username is already taken"
        defaultValue="johndoe"
      />
    </div>
  ),
};
