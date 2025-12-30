import type { Meta, StoryObj } from '@storybook/react';
import {
  MessageSquare,
  HelpCircle,
  Keyboard,
  Flag,
  Trash2,
  Download,
  Share,
} from 'lucide-react';
import { MoreMenu } from './MoreMenu';

const meta: Meta<typeof MoreMenu> = {
  title: 'Layout/MoreMenu',
  component: MoreMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A dropdown menu for additional actions. Triggered by a "more" icon button.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 flex justify-end">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MoreMenu>;

export const Default: Story = {
  args: {
    config: {
      items: [
        {
          id: 'feedback',
          label: 'Send feedback',
          onClick: () => console.log('Feedback clicked'),
        },
        {
          id: 'help',
          label: 'Help & docs',
          onClick: () => console.log('Help clicked'),
        },
        {
          id: 'shortcuts',
          label: 'Keyboard shortcuts',
          onClick: () => console.log('Shortcuts clicked'),
        },
      ],
    },
  },
};

export const WithIcons: Story = {
  args: {
    config: {
      items: [
        {
          id: 'feedback',
          label: 'Send feedback',
          icon: <MessageSquare className="h-4 w-4" />,
          onClick: () => console.log('Feedback clicked'),
        },
        {
          id: 'help',
          label: 'Help & docs',
          icon: <HelpCircle className="h-4 w-4" />,
          onClick: () => console.log('Help clicked'),
        },
        {
          id: 'shortcuts',
          label: 'Keyboard shortcuts',
          icon: <Keyboard className="h-4 w-4" />,
          onClick: () => console.log('Shortcuts clicked'),
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu items can include icons for better visual clarity.',
      },
    },
  },
};

export const WithDisabledItems: Story = {
  args: {
    config: {
      items: [
        {
          id: 'download',
          label: 'Download',
          icon: <Download className="h-4 w-4" />,
          onClick: () => console.log('Download clicked'),
        },
        {
          id: 'share',
          label: 'Share',
          icon: <Share className="h-4 w-4" />,
          disabled: true,
        },
        {
          id: 'report',
          label: 'Report issue',
          icon: <Flag className="h-4 w-4" />,
          onClick: () => console.log('Report clicked'),
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Items can be disabled to indicate unavailable actions.',
      },
    },
  },
};

export const WithDangerItem: Story = {
  args: {
    config: {
      items: [
        {
          id: 'download',
          label: 'Download',
          icon: <Download className="h-4 w-4" />,
          onClick: () => console.log('Download clicked'),
        },
        {
          id: 'share',
          label: 'Share',
          icon: <Share className="h-4 w-4" />,
          onClick: () => console.log('Share clicked'),
        },
        {
          id: 'delete',
          label: 'Delete project',
          icon: <Trash2 className="h-4 w-4" />,
          danger: true,
          onClick: () => console.log('Delete clicked'),
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Danger items are styled in red to indicate destructive actions.',
      },
    },
  },
};

export const MixedStates: Story = {
  args: {
    config: {
      items: [
        {
          id: 'feedback',
          label: 'Send feedback',
          icon: <MessageSquare className="h-4 w-4" />,
          onClick: () => console.log('Feedback clicked'),
        },
        {
          id: 'help',
          label: 'Help & docs',
          icon: <HelpCircle className="h-4 w-4" />,
          onClick: () => console.log('Help clicked'),
        },
        {
          id: 'shortcuts',
          label: 'Keyboard shortcuts',
          icon: <Keyboard className="h-4 w-4" />,
          disabled: true,
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 className="h-4 w-4" />,
          danger: true,
          onClick: () => console.log('Delete clicked'),
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing items with different states combined.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    config: {
      items: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'When there are no items, the menu button is not rendered at all.',
      },
    },
  },
};
