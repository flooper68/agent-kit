import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Code, LayoutDashboard, Settings, FileText, Play } from 'lucide-react';
import { NavigationTabs } from './NavigationTabs';

const meta: Meta<typeof NavigationTabs> = {
  title: 'Primitives/NavigationTabs',
  component: NavigationTabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A horizontal tab navigation component. Commonly used in headers for switching between views.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationTabs>;

const DefaultComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <NavigationTabs
      tabs={[
        { id: 'code', label: 'Code' },
        { id: 'preview', label: 'Preview' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const Default: Story = {
  render: () => <DefaultComponent />,
};

const WithIconsComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <NavigationTabs
      tabs={[
        {
          id: 'code',
          label: 'Code',
          icon: <Code className="h-4 w-4" />,
        },
        {
          id: 'preview',
          label: 'Preview',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const WithIcons: Story = {
  render: () => <WithIconsComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Tabs can include icons for better visual identification.',
      },
    },
  },
};

const ThreeTabsComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <NavigationTabs
      tabs={[
        {
          id: 'code',
          label: 'Code',
          icon: <Code className="h-4 w-4" />,
        },
        {
          id: 'preview',
          label: 'Preview',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const ThreeTabs: Story = {
  render: () => <ThreeTabsComponent />,
};

const WithTooltipsComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <NavigationTabs
      tabs={[
        {
          id: 'code',
          label: 'Code',
          icon: <Code className="h-4 w-4" />,
          tooltip: 'View and edit source code',
        },
        {
          id: 'preview',
          label: 'Preview',
          icon: <LayoutDashboard className="h-4 w-4" />,
          tooltip: 'Preview your application',
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const WithTooltips: Story = {
  render: () => <WithTooltipsComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Tabs can have tooltips for additional context.',
      },
    },
  },
};

const WithDisabledComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <NavigationTabs
      tabs={[
        {
          id: 'code',
          label: 'Code',
          icon: <Code className="h-4 w-4" />,
        },
        {
          id: 'preview',
          label: 'Preview',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: 'deploy',
          label: 'Deploy',
          icon: <Play className="h-4 w-4" />,
          disabled: true,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const WithDisabled: Story = {
  render: () => <WithDisabledComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Tabs can be disabled to indicate unavailable options.',
      },
    },
  },
};

const ManyTabsComponent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <NavigationTabs
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'files', label: 'Files', icon: <FileText className="h-4 w-4" /> },
        { id: 'code', label: 'Code', icon: <Code className="h-4 w-4" /> },
        {
          id: 'preview',
          label: 'Preview',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export const ManyTabs: Story = {
  render: () => <ManyTabsComponent />,
};

const InHeaderComponent = () => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <span className="font-medium">My Project</span>
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
      <div className="w-24" /> {/* Spacer for symmetry */}
    </div>
  );
};

export const InHeader: Story = {
  render: () => <InHeaderComponent />,
  parameters: {
    docs: {
      description: {
        story: 'Example of NavigationTabs used in a header context.',
      },
    },
  },
};
