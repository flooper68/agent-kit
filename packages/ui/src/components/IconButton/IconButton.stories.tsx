import type { Meta, StoryObj } from '@storybook/react';
import { Settings, Bell, Zap, Trash2, Plus, Search } from 'lucide-react';
import { IconButton } from './IconButton';
import { Tooltip } from '../Tooltip';

const meta: Meta<typeof IconButton> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A button that displays only an icon. Useful for toolbars and compact UI elements.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    icon: <Settings className="h-4 w-4" />,
    label: 'Settings',
  },
};

export const Small: Story = {
  args: {
    icon: <Bell className="h-3.5 w-3.5" />,
    label: 'Notifications',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    icon: <Zap className="h-4 w-4" />,
    label: 'Quick actions',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    icon: <Plus className="h-5 w-5" />,
    label: 'Add new',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton
        icon={<Search className="h-3.5 w-3.5" />}
        label="Small"
        size="sm"
      />
      <IconButton
        icon={<Search className="h-4 w-4" />}
        label="Medium"
        size="md"
      />
      <IconButton
        icon={<Search className="h-5 w-5" />}
        label="Large"
        size="lg"
      />
    </div>
  ),
};

export const Ghost: Story = {
  args: {
    icon: <Settings className="h-4 w-4" />,
    label: 'Settings',
    variant: 'ghost',
  },
};

export const Outline: Story = {
  args: {
    icon: <Settings className="h-4 w-4" />,
    label: 'Settings',
    variant: 'outline',
  },
};

export const Primary: Story = {
  args: {
    icon: <Plus className="h-4 w-4" />,
    label: 'Add new',
    variant: 'primary',
  },
};

export const Destructive: Story = {
  args: {
    icon: <Trash2 className="h-4 w-4" />,
    label: 'Delete',
    variant: 'destructive',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        label="Ghost"
        variant="ghost"
      />
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        label="Outline"
        variant="outline"
      />
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        label="Secondary"
        variant="secondary"
      />
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        label="Primary"
        variant="primary"
      />
      <IconButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Destructive"
        variant="destructive"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    icon: <Settings className="h-4 w-4" />,
    label: 'Settings',
    disabled: true,
  },
};

export const WithTooltip: Story = {
  render: () => (
    <Tooltip content="Open settings">
      <IconButton
        icon={<Settings className="h-4 w-4" />}
        label="Settings"
        variant="ghost"
      />
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Wrap IconButton in a Tooltip for better accessibility and UX.',
      },
    },
  },
};

export const ToolbarExample: Story = {
  render: () => (
    <div className="flex items-center gap-1 p-2 border rounded-md bg-background">
      <Tooltip content="Quick actions">
        <IconButton
          icon={<Zap className="h-4 w-4" />}
          label="Quick actions"
          variant="ghost"
          size="sm"
        />
      </Tooltip>
      <Tooltip content="Notifications">
        <IconButton
          icon={<Bell className="h-4 w-4" />}
          label="Notifications"
          variant="ghost"
          size="sm"
        />
      </Tooltip>
      <Tooltip content="Settings">
        <IconButton
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          variant="ghost"
          size="sm"
        />
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of IconButtons used in a toolbar layout.',
      },
    },
  },
};
