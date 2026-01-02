import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import {
  Dialog,
  Heading,
  Text,
  Label,
  Tabs,
  Button,
  Select,
  Input,
} from '@agent-kit/ui';
import { Users, Mail, UserPlus } from 'lucide-react';
import { MembersList } from '../../components/settings/MembersList';
import { InvitationsList } from '../../components/settings/InvitationsList';
import { trpc } from '../../lib/trpc';
import { checkIsAdmin } from '../../lib/auth';

export function SettingsPage() {
  const [tab, setTab] = useState('members');
  const { membership } = useOrganization();
  const isAdmin = checkIsAdmin(membership?.role);

  useEffect(() => {
    document.title = 'Users | Agent Kit';
  }, []);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Users
          </Heading>
          <Text className="text-muted-foreground">
            Manage your organization members and invitations
          </Text>
        </div>

        {/* Tabs with Invite button */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4">
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
            {isAdmin && <InviteMemberButton />}
          </div>

          <Tabs.Content value="members" className="flex-1 overflow-y-auto">
            <MembersList />
          </Tabs.Content>

          <Tabs.Content value="invitations" className="flex-1 overflow-y-auto">
            <InvitationsList />
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  );
}

function InviteMemberButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'org:admin' | 'org:member'>('org:member');
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const inviteMutation = trpc.members.invite.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      setEmail('');
      setRole('org:member');
      setError(null);
      utils.members.list.invalidate();
      utils.members.listInvitations.invalidate();
    },
    onError: (err) => {
      setError(err.message || 'Failed to send invitation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    inviteMutation.mutate({ email: email.trim(), role });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEmail('');
      setRole('org:member');
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </Dialog.Trigger>
      <Dialog.Content size="sm">
        <Dialog.Header>
          <Dialog.Title>Invite Team Member</Dialog.Title>
          <Dialog.Description>
            Send an invitation to join this project. They will receive an email
            with a link to join.
          </Dialog.Description>
        </Dialog.Header>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'org:admin' | 'org:member')
              }
              options={[
                { value: 'org:member', label: 'Member' },
                { value: 'org:admin', label: 'Admin' },
              ]}
            />
          </div>

          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
