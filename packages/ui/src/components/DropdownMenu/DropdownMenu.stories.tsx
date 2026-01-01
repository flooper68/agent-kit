import type { Meta, StoryObj } from '@storybook/react';
import {
  MoreHorizontal,
  Shield,
  User,
  Trash2,
  Settings,
  LogOut,
} from 'lucide-react';
import { DropdownMenu } from './DropdownMenu';
import { IconButton } from '../IconButton';
import { Button } from '../Button';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Primitives/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithIconButton: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MoreHorizontal className="h-4 w-4" />}
          label="Open menu"
          variant="ghost"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item>
          <Shield className="h-4 w-4" />
          Change to Admin
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="destructive">
          <Trash2 className="h-4 w-4" />
          Remove
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>My Account</DropdownMenu.Label>
        <DropdownMenu.Item>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Label>Danger Zone</DropdownMenu.Label>
        <DropdownMenu.Item variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const MemberActions: Story = {
  name: 'Member Actions (Settings Modal)',
  render: () => (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="h-10 w-10 rounded-full bg-muted" />
      <div className="flex-1">
        <p className="font-medium">John Doe</p>
        <p className="text-sm text-muted-foreground">john@example.com</p>
      </div>
      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
        <User className="h-3 w-3" />
        Member
      </span>
      <span className="text-sm text-muted-foreground">1w ago</span>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <IconButton
            icon={<MoreHorizontal className="h-4 w-4" />}
            label="Member actions"
            variant="ghost"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item>
            <Shield className="h-4 w-4" />
            Change to Admin
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item variant="destructive">
            <Trash2 className="h-4 w-4" />
            Remove
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  ),
};
