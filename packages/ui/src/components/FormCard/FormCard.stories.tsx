import type { Meta, StoryObj } from '@storybook/react';
import { FormCard } from './FormCard';
import { Input } from '../Input';
import { Button } from '../Button';

const meta: Meta<typeof FormCard> = {
  title: 'Primitives/FormCard',
  component: FormCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof FormCard>;

export const Default: Story = {
  args: {
    title: 'Form Title',
    description: 'A brief description of what this form does.',
    children: <div className="h-24 rounded bg-muted" />,
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Sign In',
    description: 'Enter your credentials to continue.',
    children: <div className="h-24 rounded bg-muted" />,
    footer: (
      <span>
        Don&apos;t have an account?{' '}
        <a href="#" className="text-primary hover:underline">
          Sign up
        </a>
      </span>
    ),
  },
};

export const SignInExample: Story = {
  render: () => (
    <FormCard
      title="Sign In"
      description="Enter your email and password to continue."
      footer={
        <span>
          Don&apos;t have an account?{' '}
          <a href="#" className="text-primary hover:underline">
            Sign up
          </a>
        </span>
      }
    >
      <form className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email..."
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password..."
        />
        <Button className="w-full">Sign In</Button>
      </form>
    </FormCard>
  ),
};

export const SignUpExample: Story = {
  render: () => (
    <FormCard
      title="Create Account"
      description="Fill in your details to get started."
      footer={
        <span>
          Already have an account?{' '}
          <a href="#" className="text-primary hover:underline">
            Sign in
          </a>
        </span>
      }
    >
      <form className="space-y-4">
        <Input id="name" label="Full Name" placeholder="Enter your name..." />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email..."
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password..."
        />
        <Button className="w-full">Create Account</Button>
      </form>
    </FormCard>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormCard
      title="Sign In"
      description="Enter your email and password to continue."
    >
      <form className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter your email..."
          defaultValue="invalid-email"
          error="Please enter a valid email address"
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password..."
        />
        <Button className="w-full">Sign In</Button>
      </form>
    </FormCard>
  ),
};
