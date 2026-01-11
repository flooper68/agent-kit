import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { ArtifactDetailPageSkeleton } from '../../components/skeletons';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';
import { useAutosave } from '../../hooks/useAutosave';

type ArtifactFormData = {
  title: string;
  content: string;
  summary: string;
};

export function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const { setActions, clearActions } = useHeaderActions();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artifactQuery = trpc.artifacts.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const autosaveMutation = trpc.artifacts.update.useMutation({
    onSuccess: () => {
      addToast({ message: 'Changes saved', variant: 'success' });
      utils.artifacts.get.invalidate({ id: id! });
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
    }),
    [editedTitle, editedContent, editedSummary]
  );

  // Autosave hook
  const autosave = useAutosave({
    data: formData,
    enabled: isEditing && !!id,
    onSave: useCallback(
      (data: ArtifactFormData, done: () => void) => {
        if (!id) {
          done();
          return;
        }
        const dataToSave = { ...data };
        autosaveMutation.mutate(
          {
            id,
            title: data.title.trim() || undefined,
            content: data.content.trim() || undefined,
            summary: data.summary.trim() || undefined,
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
      [id, autosaveMutation]
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
    // Initialize autosave ref with current data
    autosave.lastSavedDataRef.current = {
      title: artifactQuery.data.title,
      content: artifactQuery.data.content,
      summary: artifactQuery.data.summary ?? '',
    };
    setIsEditing(true);
  }, [artifactQuery.data, autosave.lastSavedDataRef]);

  const handleDone = useCallback(() => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
    setEditedSummary('');
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
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1.5">
            <Link
              to="/app/artifacts"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Artifacts
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">Not Found</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-16">
            <Text className="mb-4 text-muted-foreground">
              The artifact you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </Text>
            <Button onClick={() => navigate('/app/artifacts')}>
              Back to Artifacts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5">
          <Link
            to="/app/artifacts"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Artifacts
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="max-w-xs truncate text-sm font-medium">
            {isEditing ? editedTitle : artifactQuery.data.title}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={autosave.trigger}
                  className="text-xl font-semibold"
                  placeholder="Artifact title"
                />
              </div>
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                onBlur={autosave.trigger}
                placeholder="Add a summary (optional)..."
                rows={2}
                className="text-muted-foreground"
              />
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
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Created: {formatDate(artifactQuery.data.createdAt)}</span>
          {new Date(artifactQuery.data.updatedAt).getTime() !==
            new Date(artifactQuery.data.createdAt).getTime() && (
            <span>Updated: {formatDate(artifactQuery.data.updatedAt)}</span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={autosave.trigger}
            className="min-h-[400px] w-full resize-none rounded-lg border bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter markdown content..."
          />
        ) : (
          <div className="rounded-lg border bg-muted/30 p-6">
            <MarkdownRenderer content={artifactQuery.data.content} />
          </div>
        )}
      </div>
    </div>
  );
}
