import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  FileText,
  Download,
  Edit,
  Copy,
  Check,
} from 'lucide-react';
import { Heading, Text, Button, MarkdownRenderer } from '@agent-kit/ui';
import { trpc } from '../../lib/trpc';
import { ArtifactDetailPageSkeleton } from '../../components/skeletons';
import { useHeaderActions } from '../../contexts/HeaderActionsContext';

export function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { setActions, clearActions } = useHeaderActions();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artifactQuery = trpc.artifacts.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const updateMutation = trpc.artifacts.update.useMutation({
    onSuccess: () => {
      utils.artifacts.get.invalidate({ id: id! });
      setIsEditing(false);
      setEditedContent('');
      setSaveError(null);
    },
    onError: (error) => {
      setSaveError(error.message || 'Failed to save artifact');
    },
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
    setEditedContent(artifactQuery.data.content);
    setIsEditing(true);
  }, [artifactQuery.data]);

  const handleSave = useCallback(() => {
    if (!id) return;
    const trimmedContent = editedContent.trim();
    if (!trimmedContent) {
      setSaveError('Content cannot be empty');
      return;
    }
    setSaveError(null);
    updateMutation.mutate({
      id,
      content: editedContent,
    });
  }, [id, editedContent, updateMutation]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
    setSaveError(null);
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
    if (artifactQuery.data && !isEditing) {
      setActions([
        {
          id: 'edit-artifact',
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          onClick: handleEdit,
          variant: 'primary',
        },
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
      ]);
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
            {artifactQuery.data.title}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-6">
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
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between gap-2">
              {saveError && (
                <Text className="text-sm text-destructive">{saveError}</Text>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[400px] w-full resize-none rounded-lg border bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter markdown content..."
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-6">
            <MarkdownRenderer content={artifactQuery.data.content} />
          </div>
        )}
      </div>
    </div>
  );
}
