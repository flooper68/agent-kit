import type { Meta, StoryObj } from '@storybook/react';
import { Users, Mail, Settings } from 'lucide-react';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="members" className="w-[400px]">
      <Tabs.List>
        <Tabs.Trigger value="members">Members</Tabs.Trigger>
        <Tabs.Trigger value="invitations">Invitations</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="members">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Members content goes here.
          </p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="invitations">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Invitations content goes here.
          </p>
        </div>
      </Tabs.Content>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="members" className="w-[400px]">
      <Tabs.List>
        <Tabs.Trigger value="members">
          <Users className="h-4 w-4" />
          Members
        </Tabs.Trigger>
        <Tabs.Trigger value="invitations">
          <Mail className="h-4 w-4" />
          Invitations
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="members">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Members content goes here.
          </p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="invitations">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Invitations content goes here.
          </p>
        </div>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[500px]">
      <Tabs.List>
        <Tabs.Trigger value="general">
          <Settings className="h-4 w-4" />
          General
        </Tabs.Trigger>
        <Tabs.Trigger value="members">
          <Users className="h-4 w-4" />
          Members
        </Tabs.Trigger>
        <Tabs.Trigger value="invitations">
          <Mail className="h-4 w-4" />
          Invitations
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="general">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            General settings content.
          </p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="members">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Members content.</p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="invitations">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Invitations content.</p>
        </div>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="members" className="w-[400px]">
      <Tabs.List>
        <Tabs.Trigger value="members">Members</Tabs.Trigger>
        <Tabs.Trigger value="invitations" disabled>
          Invitations
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="members">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Members content goes here.
          </p>
        </div>
      </Tabs.Content>
    </Tabs>
  ),
};
