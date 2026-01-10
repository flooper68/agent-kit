import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Edit, Trash2, Lock } from 'lucide-react';
import { Heading, Text, Button, Dialog, FileTree } from '@agent-kit/ui';
import type { FileItem } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { setActions, setMenuItems, clearActions } = useHeaderActions();

  const skillQuery = trpc.skills.get.useQuery({ id: id! }, { enabled: !!id });

  const deleteMutation = trpc.skills.delete.useMutation({
    onSuccess: () => {
      utils.skills.list.invalidate();
      navigate('/app/skills');
    },
  });

  useEffect(() => {
    if (skillQuery.data) {
      document.title = `${skillQuery.data.name} | Agent Kit`;
    }
    return () => {
      document.title = 'Agent Kit';
    };
  }, [skillQuery.data]);

  // Set header actions for non-system skills
  useEffect(() => {
    if (skillQuery.data && !skillQuery.data.isSystem) {
      setActions([
        {
          id: 'edit-skill',
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          onClick: () => navigate(`/app/skills/${skillQuery.data.id}/edit`),
          variant: 'primary',
        },
      ]);
      setMenuItems([
        {
          id: 'delete-skill',
          label: 'Delete',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => setShowDeleteDialog(true),
          danger: true,
        },
      ]);
    } else {
      clearActions();
    }
    return () => clearActions();
  }, [skillQuery.data, setActions, setMenuItems, clearActions, navigate]);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Loading state
  if (skillQuery.isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="mb-6">
            <div className="mb-2 h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-96 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error/not found state
  if (skillQuery.error || !skillQuery.data) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-3 flex items-center gap-1.5">
            <Link
              to="/app/skills"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skills
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">Not Found</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-16">
            <Text className="mb-4 text-muted-foreground">
              The skill you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </Text>
            <Button onClick={() => navigate('/app/skills')}>
              Back to Skills
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const skill = skillQuery.data;
  const files = skill.files as FileItem[];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5">
          <Link
            to="/app/skills"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skills
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="max-w-xs truncate text-sm font-medium">
            {skill.name}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            <Heading as="h1" size="24">
              {skill.name}
            </Heading>
            {skill.isSystem && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Lock className="mr-1 h-3 w-3" />
                System
              </span>
            )}
          </div>
          <Text className="text-muted-foreground">{skill.description}</Text>
        </div>

        {/* Metadata */}
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Key: {skill.key}</span>
          <span>Created: {formatDate(skill.createdAt)}</span>
          {new Date(skill.updatedAt).getTime() !==
            new Date(skill.createdAt).getTime() && (
            <span>Updated: {formatDate(skill.updatedAt)}</span>
          )}
        </div>

        {/* Files */}
        <div className="space-y-4">
          <Heading as="h2" size="16">
            Files ({files.length})
          </Heading>
          <FileTree files={files} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Skill</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete &ldquo;{skill.name}&rdquo;? This
              action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: skill.id })}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
