import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronRight,
  FileText,
  Download,
  Edit,
  Copy,
  Check,
} from 'lucide-react';
import {
  Heading,
  Text,
  Button,
  MarkdownRenderer,
  Input,
  Textarea,
  useToast,
  TagBadge,
  TagInput,
  type Tag,
} from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { ArtifactDetailPageSkeleton } from '../../components/skeletons';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';
import { useAutosave } from '../../hooks/useAutosave';

type ArtifactFormData = {
  title: string;
  content: string;
  summary: string;
  tags: string[];
};

interface FromProjectState {
  fromProject?: {
    id: string;
    returnTab: string;
  };
}

export function ArtifactDetailPage() {
  const { id, projectId, artifactId } = useParams<{
    id?: string;
    projectId?: string;
    artifactId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();

  // Determine effective artifact ID (from /artifacts/:id or /projects/:projectId/artifacts/:artifactId)
  const effectiveArtifactId = artifactId || id;

  // Check if in project context - URL param takes precedence over location state
  const fromProjectState = (location.state as FromProjectState | null)
    ?.fromProject;
  const fromProjectId = projectId || fromProjectState?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedTags, setEditedTags] = useState<Tag[]>([]);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artifactQuery = trpc.artifacts.get.useQuery(
    { id: effectiveArtifactId! },
    { enabled: !!effectiveArtifactId }
  );

  // Fetch tag suggestions for autocomplete
  const tagsQuery = trpc.artifacts.getTags.useQuery(
    { limit: 50 },
    { enabled: isEditing }
  );

  // Fetch project name if in project context
  const projectQuery = trpc.projects.get.useQuery(
    { id: fromProjectId ?? '' },
    { enabled: !!fromProjectId }
  );

  const autosaveMutation = trpc.artifacts.update.useMutation({
    onSuccess: () => {
      addToast({ message: 'Changes saved', variant: 'success' });
      utils.artifacts.get.invalidate({ id: effectiveArtifactId! });
      utils.artifacts.list.invalidate();
    },
    onError: (error) => {
      addToast({
        message: `Failed to save: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Memoized form data for autosave
  const formData = useMemo(
    (): ArtifactFormData => ({
      title: editedTitle,
      content: editedContent,
      summary: editedSummary,
      tags: editedTags.map((t) => t.label),
    }),
    [editedTitle, editedContent, editedSummary, editedTags]
  );

  // Autosave hook
  const autosave = useAutosave({
    data: formData,
    enabled: isEditing && !!effectiveArtifactId,
    onSave: useCallback(
      (data: ArtifactFormData, done: () => void) => {
        if (!effectiveArtifactId) {
          done();
          return;
        }
        const dataToSave = { ...data };
        autosaveMutation.mutate(
          {
            id: effectiveArtifactId,
            title: data.title.trim() || undefined,
            content: data.content.trim() || undefined,
            summary: data.summary.trim() || undefined,
            tags: data.tags,
          },
          {
            onSuccess: () => {
              autosave.lastSavedDataRef.current = dataToSave;
            },
            onSettled: done,
          }
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [effectiveArtifactId, autosaveMutation]
    ),
  });

  const handleDownload = useCallback(() => {
    if (!artifactQuery.data) return;
    const blob = new Blob([artifactQuery.data.content], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactQuery.data.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [artifactQuery.data]);

  const handleCopy = useCallback(async () => {
    if (!artifactQuery.data) return;
    try {
      await navigator.clipboard.writeText(artifactQuery.data.content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [artifactQuery.data]);

  const handleEdit = useCallback(() => {
    if (!artifactQuery.data) return;
    setEditedTitle(artifactQuery.data.title);
    setEditedContent(artifactQuery.data.content);
    setEditedSummary(artifactQuery.data.summary ?? '');
    // Convert string tags to Tag objects
    const tagObjects: Tag[] = (artifactQuery.data.tags ?? []).map((tag) => ({
      id: tag,
      label: tag,
    }));
    setEditedTags(tagObjects);
    // Initialize autosave ref with current data
    autosave.lastSavedDataRef.current = {
      title: artifactQuery.data.title,
      content: artifactQuery.data.content,
      summary: artifactQuery.data.summary ?? '',
      tags: artifactQuery.data.tags ?? [],
    };
    setIsEditing(true);
  }, [artifactQuery.data, autosave.lastSavedDataRef]);

  const handleDone = useCallback(() => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
    setEditedSummary('');
    setEditedTags([]);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (artifactQuery.data) {
      document.title = `${artifactQuery.data.title} | Agent Kit`;
    }
    return () => {
      document.title = 'Agent Kit';
    };
  }, [artifactQuery.data]);

  // Set header actions
  useEffect(() => {
    if (artifactQuery.data) {
      if (isEditing) {
        // Edit mode: show Done button
        setActions([
          {
            id: 'done-editing',
            label: 'Done',
            icon: <Check className="h-4 w-4" />,
            onClick: handleDone,
            variant: 'primary',
          },
        ]);
      } else {
        // View mode: Copy, Download, Edit (Edit on right)
        setActions([
          {
            id: 'copy-artifact',
            label: copied ? 'Copied!' : 'Copy',
            icon: copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            ),
            onClick: handleCopy,
            variant: 'outline',
          },
          {
            id: 'download-artifact',
            label: 'Download',
            icon: <Download className="h-4 w-4" />,
            onClick: handleDownload,
            variant: 'outline',
          },
          {
            id: 'edit-artifact',
            label: 'Edit',
            icon: <Edit className="h-4 w-4" />,
            onClick: handleEdit,
            variant: 'primary',
          },
        ]);
      }
    } else {
      clearActions();
    }
    return () => clearActions();
  }, [
    artifactQuery.data,
    isEditing,
    copied,
    setActions,
    clearActions,
    handleEdit,
    handleCopy,
    handleDownload,
    handleDone,
  ]);

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
  if (artifactQuery.isLoading) {
    return <ArtifactDetailPageSkeleton />;
  }

  // Error/not found state
  if (artifactQuery.error || !artifactQuery.data) {
    const backPath = fromProjectId
      ? `/app/projects/${fromProjectId}?tab=documents`
      : '/app/artifacts';
    const backLabel = fromProjectId ? 'Back to Project' : 'Back to Artifacts';

    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1.5">
            {fromProjectId ? (
              <>
                <Link
                  to="/app/projects"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Projects
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <Link
                  to={`/app/projects/${fromProjectId}?tab=documents`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {projectQuery.data?.title ?? 'Project'}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Documents</span>
              </>
            ) : (
              <Link
                to="/app/artifacts"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Artifacts
              </Link>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">Not Found</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-16">
            <Text className="mb-4 text-muted-foreground">
              The artifact you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </Text>
            <Button onClick={() => navigate(backPath)}>{backLabel}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden">
        {/* Breadcrumb */}
        <nav className="mb-3 flex shrink-0 items-center gap-1.5">
          {fromProjectId ? (
            <>
              <Link
                to="/app/projects"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Projects
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <Link
                to={`/app/projects/${fromProjectId}?tab=documents`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {projectQuery.data?.title ?? 'Project'}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <Link
                to={`/app/projects/${fromProjectId}?tab=documents`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Documents
              </Link>
            </>
          ) : (
            <Link
              to="/app/artifacts"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Artifacts
            </Link>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="max-w-xs truncate text-sm font-medium">
            {isEditing ? editedTitle : artifactQuery.data.title}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6 shrink-0">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={autosave.trigger}
                className="w-full text-xl font-semibold"
                placeholder="Artifact title"
              />
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                onBlur={autosave.trigger}
                placeholder="Add a summary (optional)..."
                rows={2}
                className="text-muted-foreground"
              />
              <div>
                <Text className="mb-2 text-sm font-medium">Tags</Text>
                <TagInput
                  value={editedTags}
                  onChange={(tags) => {
                    setEditedTags(tags);
                    // Trigger autosave on tag change
                    setTimeout(() => autosave.trigger(), 0);
                  }}
                  suggestions={
                    tagsQuery.data?.map((t) => ({
                      id: t.tag,
                      label: t.tag,
                    })) ?? []
                  }
                  placeholder="Add tags..."
                  allowCreate
                  maxTags={20}
                  isLoading={tagsQuery.isLoading}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <Heading as="h1" size="24">
                  {artifactQuery.data.title}
                </Heading>
              </div>
              {artifactQuery.data.summary && (
                <Text className="text-muted-foreground">
                  {artifactQuery.data.summary}
                </Text>
              )}
              {artifactQuery.data.tags &&
                artifactQuery.data.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {artifactQuery.data.tags.map((tag) => (
                      <TagBadge key={tag} label={tag} size="sm" />
                    ))}
                  </div>
                )}
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="mb-6 flex shrink-0 flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Created: {formatDate(artifactQuery.data.createdAt)}</span>
          {new Date(artifactQuery.data.updatedAt).getTime() !==
            new Date(artifactQuery.data.createdAt).getTime() && (
            <span>Updated: {formatDate(artifactQuery.data.updatedAt)}</span>
          )}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onBlur={autosave.trigger}
              className="h-full w-full resize-none rounded-lg border bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter markdown content..."
            />
          ) : (
            <div className="h-full overflow-auto rounded-lg border bg-muted/30 p-6">
              <MarkdownRenderer content={artifactQuery.data.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
