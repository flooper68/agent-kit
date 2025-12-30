import type { Meta, StoryObj } from '@storybook/react';
import { ProviderIcon } from './ProviderIcon';

const meta: Meta<typeof ProviderIcon> = {
  title: 'Chat/ProviderIcons/ProviderIcon',
  component: ProviderIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    provider: {
      control: 'select',
      options: [
        'anthropic',
        'openai',
        'google',
        'mistral',
        'cohere',
        'meta',
        'unknown',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderIcon>;

export const Default: Story = {
  args: {
    provider: 'anthropic',
    size: 'md',
  },
};

export const AllProviders: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      {(
        [
          'anthropic',
          'openai',
          'google',
          'mistral',
          'cohere',
          'meta',
          'unknown',
        ] as const
      ).map((p) => (
        <div key={p} className="flex flex-col items-center gap-2">
          <ProviderIcon provider={p} size="lg" />
          <span className="text-xs text-muted-foreground capitalize">{p}</span>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-6 items-end">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <ProviderIcon provider="anthropic" size={size} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
};
