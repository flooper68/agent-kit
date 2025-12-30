import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Zap,
  Bell,
  Share,
  Code,
  LayoutDashboard,
  Home,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Header } from './Header';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';
import { StatusIndicator } from '../StatusIndicator';
import { NavigationTabs } from '../NavigationTabs';
import { ThemeProvider } from '../../theme';

// We need to wrap Header in AppLayout for stories since Header uses useAppLayout
import { AppLayout } from './AppLayout';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The header component for AppLayout. Contains multiple zones:
- Left: Main menu + tool buttons + panel toggle
- Center: Navigation tabs + status indicator
- Right: Action buttons + more menu

**Note:** Header requires AppLayout context to function. These stories show various header configurations within the full AppLayout.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="h-screen">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  render: () => (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">Main content</div>
    </AppLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic header with just the main menu.',
      },
    },
  },
};

export const WithToolButtons: Story = {
  render: () => (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      headerSlots={{
        toolButtons: (
          <>
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
          </>
        ),
      }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">Main content</div>
    </AppLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header with tool buttons next to the panel toggle.',
      },
    },
  },
};

const WithNavigationComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      headerSlots={{
        navigation: (
          <NavigationTabs
            tabs={[
              {
                id: 'code',
                label: 'Code',
                icon: <Code className="h-4 w-4" />,
                tooltip: 'View source code',
              },
              {
                id: 'preview',
                label: 'Preview',
                icon: <LayoutDashboard className="h-4 w-4" />,
                tooltip: 'Preview application',
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ),
      }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">
        Active tab: <strong>{activeTab}</strong>
      </div>
    </AppLayout>
  );
};

export const WithNavigation: Story = {
  render: () => <WithNavigationComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Header with navigation tabs in the center-left area.',
      },
    },
  },
};

export const WithStatus: Story = {
  render: () => (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      headerSlots={{
        status: <StatusIndicator status="connected" label="Connected" />,
      }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">Main content</div>
    </AppLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Header with a status indicator centered in the main content area.',
      },
    },
  },
};

export const WithActions: Story = {
  render: () => (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      headerSlots={{
        secondaryAction: (
          <Tooltip content="Share with collaborators">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-1.5" />
              Share
            </Button>
          </Tooltip>
        ),
        primaryAction: (
          <Tooltip content="Deploy to production">
            <Button size="sm">Deploy</Button>
          </Tooltip>
        ),
      }}
      moreMenu={{
        items: [
          { id: 'help', label: 'Help', onClick: () => console.log('Help') },
          {
            id: 'feedback',
            label: 'Feedback',
            onClick: () => console.log('Feedback'),
          },
        ],
      }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">Main content</div>
    </AppLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header with action buttons and more menu on the right.',
      },
    },
  },
};

const FullFeaturedHeaderComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <AppLayout
      mainMenu={{
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
              { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
              {
                id: 'settings',
                label: 'Settings',
                icon: <Settings className="h-4 w-4" />,
              },
            ],
          },
        ],
        showThemeToggle: true,
        onSignOut: () => console.log('Sign out'),
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          avatarFallback: 'JD',
        },
      }}
      moreMenu={{
        items: [
          { id: 'help', label: 'Help & docs' },
          { id: 'feedback', label: 'Send feedback' },
          { id: 'shortcuts', label: 'Keyboard shortcuts' },
        ],
      }}
      headerSlots={{
        toolButtons: (
          <>
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
          </>
        ),
        navigation: (
          <NavigationTabs
            tabs={[
              {
                id: 'code',
                label: 'Code',
                icon: <Code className="h-4 w-4" />,
                tooltip: 'View source code',
              },
              {
                id: 'preview',
                label: 'Preview',
                icon: <LayoutDashboard className="h-4 w-4" />,
                tooltip: 'Preview application',
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ),
        status: <StatusIndicator status="connected" label="Connected" />,
        secondaryAction: (
          <Tooltip content="Share with collaborators">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-1.5" />
              Share
            </Button>
          </Tooltip>
        ),
        primaryAction: (
          <Tooltip content="Deploy to production">
            <Button size="sm">Deploy</Button>
          </Tooltip>
        ),
      }}
      panelConfig={{
        defaultWidth: 400,
        minWidth: 320,
        maxWidth: 600,
      }}
      assistantPanel={
        <div className="h-full flex items-center justify-center text-muted-foreground p-4">
          Assistant Panel
        </div>
      }
    >
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Main Content ({activeTab})
      </div>
    </AppLayout>
  );
};

export const FullFeatured: Story = {
  render: () => <FullFeaturedHeaderComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Complete header with all slots populated.',
      },
    },
  },
};

export const CollapsedPanel: Story = {
  render: () => (
    <AppLayout
      mainMenu={{ appName: 'My App' }}
      headerSlots={{
        status: <StatusIndicator status="connected" label="Connected" />,
      }}
      panelConfig={{ defaultCollapsed: true }}
      assistantPanel={<div className="p-4 text-muted-foreground">Panel</div>}
    >
      <div className="p-4">
        Panel is collapsed by default. Click toggle to expand.
      </div>
    </AppLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Header with the panel collapsed. Note the left zone adjusts width.',
      },
    },
  },
};
