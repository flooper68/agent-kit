import { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
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

  if (diffMonths > 0) return `Sent ${diffMonths}mo ago`;
  if (diffWeeks > 0) return `Sent ${diffWeeks}w ago`;
  if (diffDays > 0) return `Sent ${diffDays}d ago`;
  if (diffHours > 0) return `Sent ${diffHours}h ago`;
  if (diffMinutes > 0) return `Sent ${diffMinutes}m ago`;
  return 'Sent just now';
}

export function InvitationsList() {
  const { membership } = useOrganization();
  const isAdmin = checkIsAdmin(membership?.role);

  const invitationsQuery = trpc.members.listInvitations.useQuery(undefined, {
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <DataList>
        <DataList.Empty>
          Only admins can view pending invitations
        </DataList.Empty>
      </DataList>
    );
  }

  if (invitationsQuery.isLoading) {
    return <InvitationsListSkeleton />;
  }

  if (invitationsQuery.error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Text className="text-destructive">
          Failed to load invitations: {invitationsQuery.error.message}
        </Text>
      </div>
    );
  }

  const invitations = invitationsQuery.data ?? [];

  if (invitations.length === 0) {
    return (
      <DataList>
        <DataList.Empty>No pending invitations</DataList.Empty>
      </DataList>
    );
  }

  return (
    <DataList>
      {invitations.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </DataList>
  );
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const isInvitationAdmin = checkIsAdmin(invitation.role);

  return (
    <DataList.Item>
      <DataList.Cell shrink>
        <Avatar fallback="?" size="md" />
      </DataList.Cell>
      <DataList.Cell grow>
        <div className="min-w-0">
          <Text className="truncate font-medium">{invitation.email}</Text>
          <Text size="13" className="truncate text-muted-foreground">
            Pending invitation
          </Text>
        </div>
      </DataList.Cell>
      <DataList.Cell shrink>
        <Text
          as="span"
          size="13"
          className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-warning"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Pending
        </Text>
      </DataList.Cell>
      <DataList.Cell shrink>
        <Text
          as="span"
          size="13"
          className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"
        >
          {isInvitationAdmin ? (
            <Shield className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {isInvitationAdmin ? 'Admin' : 'Member'}
        </Text>
      </DataList.Cell>
      <DataList.Cell shrink>
        <Text as="span" size="13" className="text-muted-foreground">
          {formatTimeAgo(invitation.createdAt)}
        </Text>
      </DataList.Cell>
      <DataList.Cell shrink>
        <InvitationActionsMenu invitation={invitation} />
      </DataList.Cell>
    </DataList.Item>
  );
}

function InvitationActionsMenu({ invitation }: { invitation: Invitation }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const utils = trpc.useUtils();

  const revokeMutation = trpc.members.revokeInvitation.useMutation({
    onSuccess: () => {
      setIsConfirmOpen(false);
      utils.members.listInvitations.invalidate();
    },
  });

  const handleRevoke = () => {
    revokeMutation.mutate({ invitationId: invitation.id });
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
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Revoke Invitation
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Revoke Invitation</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to revoke this invitation? The recipient
              will no longer be able to join the project with this invite.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="ghost" disabled={revokeMutation.isPending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              isLoading={revokeMutation.isPending}
            >
              Revoke
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

function InvitationsListSkeleton() {
  return (
    <DataList>
      {[1, 2].map((i) => (
        <DataList.Item key={i}>
          <DataList.Cell shrink>
            <Skeleton className="h-10 w-10 rounded-full" />
          </DataList.Cell>
          <DataList.Cell grow>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-6 w-16 rounded-full" />
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-6 w-16 rounded-full" />
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-4 w-20" />
          </DataList.Cell>
          <DataList.Cell shrink>
            <Skeleton className="h-8 w-8 rounded-md" />
          </DataList.Cell>
        </DataList.Item>
      ))}
    </DataList>
  );
}
