import type { Meta, StoryObj } from '@storybook/react';
import { Home, Settings, FileText, Users, Sparkles } from 'lucide-react';
import { MainMenu } from './MainMenu';
import { ThemeProvider } from '../../theme';

const meta: Meta<typeof MainMenu> = {
  title: 'Layout/MainMenu',
  component: MainMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The main application menu dropdown. Displays branding, navigation items, theme toggle, sign out option, and user profile.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MainMenu>;

export const Default: Story = {
  args: {
    config: {
      appName: 'My App',
    },
  },
};

export const WithAppIcon: Story = {
  args: {
    config: {
      appName: 'Agent Kit',
      appIcon: <Sparkles className="h-4 w-4" />,
    },
  },
};

export const WithBranding: Story = {
  args: {
    config: {
      appName: 'Agent Kit',
      appIcon: <Sparkles className="h-4 w-4" />,
      branding: {
        logo: <Sparkles className="h-5 w-5 text-primary" />,
        name: 'Agent Kit',
        tagline: 'Build AI-powered apps',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Branding section appears at the top of the menu dropdown.',
      },
    },
  },
};

export const WithSections: Story = {
  args: {
    config: {
      appName: 'My App',
      sections: [
        {
          id: 'main',
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: <Home className="h-4 w-4" />,
              onClick: () => console.log('Home clicked'),
            },
            {
              id: 'projects',
              label: 'Projects',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => console.log('Projects clicked'),
            },
            {
              id: 'team',
              label: 'Team',
              icon: <Users className="h-4 w-4" />,
              onClick: () => console.log('Team clicked'),
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: <Settings className="h-4 w-4" />,
              onClick: () => console.log('Settings clicked'),
            },
          ],
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu items with icons organized in sections.',
      },
    },
  },
};

export const WithLabeledSection: Story = {
  args: {
    config: {
      appName: 'My App',
      sections: [
        {
          id: 'navigation',
          label: 'Navigation',
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: <Home className="h-4 w-4" />,
            },
            {
              id: 'projects',
              label: 'Projects',
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          id: 'settings',
          label: 'Settings',
          items: [
            {
              id: 'preferences',
              label: 'Preferences',
              icon: <Settings className="h-4 w-4" />,
            },
          ],
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sections can have labels to group related items.',
      },
    },
  },
};

export const WithThemeToggle: Story = {
  args: {
    config: {
      appName: 'My App',
      showThemeToggle: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Include a theme toggle to switch between light and dark modes.',
      },
    },
  },
};

export const WithSignOut: Story = {
  args: {
    config: {
      appName: 'My App',
      onSignOut: () => console.log('Signing out...'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign out button appears when onSignOut handler is provided.',
      },
    },
  },
};

export const WithProfile: Story = {
  args: {
    config: {
      appName: 'My App',
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        avatarFallback: 'JD',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'User profile section appears at the bottom of the menu.',
      },
    },
  },
};

export const WithProfileAvatar: Story = {
  args: {
    config: {
      appName: 'My App',
      profile: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatarSrc: 'https://i.pravatar.cc/150?u=jane',
        avatarFallback: 'JS',
      },
    },
  },
};

export const FullFeatured: Story = {
  args: {
    config: {
      appName: 'Agent Kit',
      appIcon: <Sparkles className="h-4 w-4" />,
      branding: {
        logo: <Sparkles className="h-5 w-5 text-primary" />,
        name: 'Agent Kit',
        tagline: 'Build AI-powered apps',
      },
      sections: [
        {
          id: 'main',
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: <Home className="h-4 w-4" />,
              onClick: () => console.log('Home clicked'),
            },
            {
              id: 'projects',
              label: 'Projects',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => console.log('Projects clicked'),
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: <Settings className="h-4 w-4" />,
              onClick: () => console.log('Settings clicked'),
            },
          ],
        },
      ],
      showThemeToggle: true,
      onSignOut: () => console.log('Signing out...'),
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        avatarFallback: 'JD',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete example with all features enabled.',
      },
    },
  },
};

export const DisabledItem: Story = {
  args: {
    config: {
      appName: 'My App',
      sections: [
        {
          id: 'main',
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: <Home className="h-4 w-4" />,
            },
            {
              id: 'premium',
              label: 'Premium Features',
              icon: <Sparkles className="h-4 w-4" />,
              disabled: true,
            },
          ],
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu items can be disabled.',
      },
    },
  },
};
