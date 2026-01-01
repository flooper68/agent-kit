import { useState } from 'react';
import { useOrganization, useUser } from '@clerk/clerk-react';
import {
  Avatar,
  Button,
  DataList,
  Dialog,
  DropdownMenu,
  IconButton,
  Skeleton,
  Text,
} from '@agent-kit/ui';
import { MoreHorizontal, Shield, Trash2, User } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { checkIsAdmin } from '../../lib/auth';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) return `${diffMonths}mo ago`;
  if (diffWeeks > 0) return `${diffWeeks}w ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
}

export function MembersList() {
  const membersQuery = trpc.members.list.useQuery();

  if (membersQuery.isLoading) {
    return <MembersListSkeleton />;
  }

  if (membersQuery.error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Text className="text-destructive">
          Failed to load members: {membersQuery.error.message}
        </Text>
      </div>
    );
  }

  const members = membersQuery.data ?? [];

  if (members.length === 0) {
    return (
      <DataList>
        <DataList.Empty>No members found</DataList.Empty>
      </DataList>
    );
  }

  return (
    <DataList>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} />
      ))}
    </DataList>
  );
}

interface Member {
  id: string;
  userId?: string | undefined;
  email?: string | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  imageUrl?: string | undefined;
  role: string;
  createdAt: number;
}

function MemberRow({ member }: { member: Member }) {
  const { user } = useUser();
  const { membership } = useOrganization();
  const isAdmin = checkIsAdmin(membership?.role);
  const isCurrentUser = member.userId === user?.id;
  const isMemberAdmin = checkIsAdmin(member.role);

  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(' ') ||
    member.email ||
    'Unknown';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DataList.Item>
      <DataList.Cell shrink>
        <Avatar src={member.imageUrl} fallback={initials} size="md" />
      </DataList.Cell>
      <DataList.Cell grow>
        <div className="min-w-0">
          <Text className="truncate font-medium">
            {displayName}
            {isCurrentUser && (
              <Text as="span" className="ml-1.5 font-normal text-muted-foreground">
                (you)
              </Text>
            )}
          </Text>
          <Text size="13" className="truncate text-muted-foreground">
            {member.email}
          </Text>
        </div>
      </DataList.Cell>
      <DataList.Cell shrink>
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
          {isMemberAdmin ? (
            <Shield className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {isMemberAdmin ? 'Admin' : 'Member'}
        </span>
      </DataList.Cell>
      <DataList.Cell shrink>
        <Text as="span" size="13" className="text-muted-foreground">
          {formatTimeAgo(member.createdAt)}
        </Text>
      </DataList.Cell>
      <DataList.Cell shrink>
        {isAdmin && !isCurrentUser && member.userId ? (
          <MemberActionsMenu member={member} />
        ) : (
          <IconButton
            icon={<MoreHorizontal className="h-4 w-4" />}
            label="Actions"
            variant="ghost"
            size="sm"
            disabled
          />
        )}
      </DataList.Cell>
    </DataList.Item>
  );
}

function MemberActionsMenu({ member }: { member: Member }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const utils = trpc.useUtils();
  const isMemberAdmin = checkIsAdmin(member.role);

  const updateRoleMutation = trpc.members.updateRole.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
    },
  });

  const removeMutation = trpc.members.remove.useMutation({
    onSuccess: () => {
      setIsConfirmOpen(false);
      utils.members.list.invalidate();
    },
  });

  const handleRoleChange = () => {
    if (!member.userId) return;
    const newRole = isMemberAdmin ? 'org:member' : 'org:admin';
    updateRoleMutation.mutate({ userId: member.userId, role: newRole });
  };

  const handleRemove = () => {
    if (!member.userId) return;
    removeMutation.mutate({ userId: member.userId });
  };

  return (
    <>
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
          <DropdownMenu.Item
            onClick={handleRoleChange}
            disabled={updateRoleMutation.isPending}
          >
            <Shield className="h-4 w-4" />
            {isMemberAdmin ? 'Change to Member' : 'Change to Admin'}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Remove Member</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to remove this member from the project? They
              will lose access immediately.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost" disabled={removeMutation.isPending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={handleRemove}
              isLoading={removeMutation.isPending}
            >
              Remove
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

function MembersListSkeleton() {
  return (
    <DataList>
      {[1, 2, 3].map((i) => (
        <DataList.Item key={i}>
          <DataList.Cell shrink>
            <Skeleton className="h-10 w-10 rounded-full" />
          </DataList.Cell>
          <DataList.Cell grow>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-6 w-16 rounded-full" />
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-4 w-12" />
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-8 w-8 rounded-md" />
          </DataList.Cell>
        </DataList.Item>
      ))}
    </DataList>
  );
}
