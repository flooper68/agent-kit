import type { Meta, StoryObj } from '@storybook/react';
import { Users, MoreHorizontal, Shield, Trash2, User } from 'lucide-react';
import { DataList } from './DataList';
import { Avatar } from '../Avatar';
import { DropdownMenu } from '../DropdownMenu';
import { IconButton } from '../IconButton';

const meta: Meta<typeof DataList> = {
  title: 'Primitives/DataList',
  component: DataList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataList className="w-[600px]">
      <DataList.Item>
        <DataList.Cell grow>
          <div>
            <p className="font-medium">Project Alpha</p>
            <p className="text-sm text-muted-foreground">project-alpha-123</p>
          </div>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />3 members
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="text-sm text-muted-foreground">12/22/2025</span>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item>
        <DataList.Cell grow>
          <div>
            <p className="font-medium">Project Beta</p>
            <p className="text-sm text-muted-foreground">project-beta-456</p>
          </div>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />5 members
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Free
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="text-sm text-muted-foreground">12/20/2025</span>
        </DataList.Cell>
      </DataList.Item>
    </DataList>
  ),
};

export const MembersList: Story = {
  name: 'Members List',
  render: () => (
    <DataList className="w-[700px]">
      <DataList.Item>
        <DataList.Cell shrink>
          <Avatar fallback="JD" size="md" />
        </DataList.Cell>
        <DataList.Cell grow>
          <div className="min-w-0">
            <p className="truncate font-medium">john@example.com</p>
            <p className="truncate text-sm text-muted-foreground">
              john@example.com
            </p>
          </div>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
            <User className="h-3 w-3" />
            Member
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="text-sm text-muted-foreground">1w ago</span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton
                icon={<MoreHorizontal className="h-4 w-4" />}
                label="Actions"
                variant="ghost"
                size="sm"
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
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item>
        <DataList.Cell shrink>
          <Avatar fallback="P" size="md" />
        </DataList.Cell>
        <DataList.Cell grow>
          <div className="min-w-0">
            <p className="truncate font-medium">
              Premysl Ciompa
              <span className="ml-1.5 text-muted-foreground font-normal">
                (you)
              </span>
            </p>
            <p className="truncate text-sm text-muted-foreground">
              premysl.ciompa@gmail.com
            </p>
          </div>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="text-sm text-muted-foreground">2w ago</span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <IconButton
            icon={<MoreHorizontal className="h-4 w-4" />}
            label="Actions"
            variant="ghost"
            size="sm"
            disabled
          />
        </DataList.Cell>
      </DataList.Item>
    </DataList>
  ),
};

export const Empty: Story = {
  render: () => (
    <DataList className="w-[600px]">
      <DataList.Empty>No items found</DataList.Empty>
    </DataList>
  ),
};

export const InvitationsList: Story = {
  name: 'Invitations List',
  render: () => (
    <DataList className="w-[600px]">
      <DataList.Item>
        <DataList.Cell shrink>
          <Avatar fallback="?" size="md" />
        </DataList.Cell>
        <DataList.Cell grow>
          <div className="min-w-0">
            <p className="truncate font-medium">invited@example.com</p>
            <p className="truncate text-sm text-muted-foreground">
              Pending invitation
            </p>
          </div>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <span className="text-sm text-muted-foreground">Sent 3d ago</span>
        </DataList.Cell>
        <DataList.Cell shrink>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton
                icon={<MoreHorizontal className="h-4 w-4" />}
                label="Actions"
                variant="ghost"
                size="sm"
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item variant="destructive">
                <Trash2 className="h-4 w-4" />
                Revoke Invitation
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </DataList.Cell>
      </DataList.Item>
    </DataList>
  ),
};
