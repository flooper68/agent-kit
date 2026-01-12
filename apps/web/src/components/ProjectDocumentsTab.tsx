import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  DataList,
  Pagination,
  IconButton,
  Dialog,
  Button,
  Input,
  Textarea,
  useToast,
  cn,
  DropdownMenu,
} from '@agent-kit/ui';
import {
  FileText,
  Trash2,
  Search,
  Plus,
  Link2,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useDebounce } from '../hooks/useDebounce';

interface ProjectDocumentsTabProps {
  projectId: string;
  isAttachDialogOpen?: boolean;
  onAttachDialogOpenChange?: (open: boolean) => void;
  isCreateDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
}

export function ProjectDocumentsTab({
  projectId,
  isAttachDialogOpen: externalAttachOpen,
  onAttachDialogOpenChange,
  isCreateDialogOpen: externalCreateOpen,
  onCreateDialogOpenChange,
}: ProjectDocumentsTabProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  // State for pagination
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const currentCursor = cursors[cursors.length - 1];

  // State for dialogs - use external state if provided, otherwise internal
  const [internalAttachOpen, setInternalAttachOpen] = useState(false);
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isAttachDialogOpen = externalAttachOpen ?? internalAttachOpen;
  const setIsAttachDialogOpen =
    onAttachDialogOpenChange ?? setInternalAttachOpen;
  const isCreateDialogOpen = externalCreateOpen ?? internalCreateOpen;
  const setIsCreateDialogOpen =
    onCreateDialogOpenChange ?? setInternalCreateOpen;
  const isExternallyControlled =
    !!onAttachDialogOpenChange || !!onCreateDialogOpenChange;

  const [detachTarget, setDetachTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // State for create form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');

  // State for attach picker
  const [attachSearch, setAttachSearch] = useState('');
  const debouncedAttachSearch = useDebounce(attachSearch, 300);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null
  );

  // Track if we're in create-and-attach flow to prevent duplicate toasts
  const isCreateAndAttachRef = useRef(false);

  // Reset pagination on search change
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch]);

  // Queries
  const artifactsQuery = trpc.projects.listArtifacts.useQuery({
    projectId,
    limit: 25,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
  });

  // Available artifacts for attaching (excludes already attached via server-side filtering)
  const availableArtifactsQuery = trpc.artifacts.list.useQuery(
    {
      limit: 50,
      search: debouncedAttachSearch || undefined,
      excludeProjectId: projectId,
    },
    {
      enabled: isAttachDialogOpen,
    }
  );

  // Mutations
  const attachMutation = trpc.projects.attachArtifact.useMutation({
    onSuccess: (result) => {
      // Skip toast if this is part of create-and-attach flow (handled by createMutation)
      if (!isCreateAndAttachRef.current) {
        if (result.alreadyAttached) {
          addToast({ message: 'Document already attached', variant: 'info' });
        } else {
          addToast({ message: 'Document attached', variant: 'success' });
        }
      }
      setIsAttachDialogOpen(false);
      setSelectedArtifactId(null);
      setAttachSearch('');
      utils.projects.listArtifacts.invalidate({ projectId });
    },
    onError: (error) => {
      addToast({ message: error.message, variant: 'error' });
    },
  });

  const detachMutation = trpc.projects.detachArtifact.useMutation({
    onSuccess: () => {
      queueMicrotask(() => setDetachTarget(null));
      addToast({ message: 'Document removed', variant: 'success' });
      utils.projects.listArtifacts.invalidate({ projectId });
    },
    onError: (error) => {
      addToast({ message: error.message, variant: 'error' });
    },
  });

  const deleteMutation = trpc.artifacts.delete.useMutation({
    onSuccess: () => {
      queueMicrotask(() => setDeleteTarget(null));
      addToast({ message: 'Document deleted', variant: 'success' });
      utils.projects.listArtifacts.invalidate({ projectId });
    },
    onError: (error) => {
      addToast({ message: error.message, variant: 'error' });
    },
  });

  const createMutation = trpc.artifacts.create.useMutation({
    onSuccess: async (artifact) => {
      // Also attach to project
      isCreateAndAttachRef.current = true;
      try {
        await attachMutation.mutateAsync({
          projectId,
          artifactId: artifact.id,
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
        addToast({
          message: 'Document created and attached',
          variant: 'success',
        });
      } catch {
        // Artifact was created but attach failed
        addToast({
          message:
            'Document created but failed to attach. You can attach it manually.',
          variant: 'info',
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
        utils.artifacts.invalidate();
      } finally {
        isCreateAndAttachRef.current = false;
      }
    },
    onError: (error) => {
      addToast({ message: error.message, variant: 'error' });
    },
  });

  const resetCreateForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewSummary('');
  };

  const handleNextPage = useCallback(() => {
    if (artifactsQuery.data?.nextCursor) {
      setCursors([...cursors, artifactsQuery.data.nextCursor]);
    }
  }, [artifactsQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Actions (actions hidden when externally controlled) */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {!isExternallyControlled && (
          <>
            <Button
              variant="outline"
              onClick={() => setIsAttachDialogOpen(true)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Attach Existing
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </>
        )}
      </div>

      {/* Loading State */}
      {artifactsQuery.isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Error State */}
      {artifactsQuery.isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <Text className="font-medium">Failed to load documents</Text>
          <Text className="mb-4 text-sm text-muted-foreground">
            {artifactsQuery.error?.message || 'An error occurred'}
          </Text>
          <Button
            variant="outline"
            onClick={() => artifactsQuery.refetch()}
            disabled={artifactsQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                artifactsQuery.isFetching && 'animate-spin'
              )}
            />
            Try Again
          </Button>
        </div>
      )}

      {/* Content */}
      {artifactsQuery.data && (
        <>
          {artifactsQuery.data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <Text className="font-medium">
                {debouncedSearch ? 'No matches found' : 'No documents attached'}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'Try a different search term'
                  : 'Attach existing documents or create new ones'}
              </Text>
            </div>
          ) : (
            <DataList>
              {artifactsQuery.data.items.map((artifact) => (
                <DataList.Item
                  key={artifact.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() =>
                    navigate(
                      `/app/projects/${projectId}/artifacts/${artifact.id}`
                    )
                  }
                >
                  <DataList.Cell shrink>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </DataList.Cell>
                  <DataList.Cell grow>
                    <div className="min-w-0">
                      <Text className="truncate font-medium">
                        {artifact.title}
                      </Text>
                      {artifact.summary && (
                        <Text className="truncate text-sm text-muted-foreground">
                          {artifact.summary}
                        </Text>
                      )}
                    </div>
                  </DataList.Cell>
                  <DataList.Cell shrink>
                    <Text className="text-sm text-muted-foreground">
                      {formatFileSize(artifact.sizeBytes)}
                    </Text>
                  </DataList.Cell>
                  <DataList.Cell shrink>
                    <Text className="text-sm text-muted-foreground">
                      {formatDate(artifact.createdAt)}
                    </Text>
                  </DataList.Cell>
                  <DataList.Cell shrink>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton
                            icon={<MoreHorizontal className="h-4 w-4" />}
                            label="Actions"
                            size="sm"
                            variant="ghost"
                          />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item
                            onClick={() =>
                              setDetachTarget({
                                id: artifact.id,
                                title: artifact.title,
                              })
                            }
                          >
                            <Link2 className="h-4 w-4" />
                            Disconnect from project
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                id: artifact.id,
                                title: artifact.title,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </div>
                  </DataList.Cell>
                </DataList.Item>
              ))}
            </DataList>
          )}

          {/* Pagination */}
          {(artifactsQuery.data.nextCursor || cursors.length > 0) && (
            <div className="mt-4">
              <Pagination
                hasNextPage={!!artifactsQuery.data.nextCursor}
                hasPreviousPage={cursors.length > 0}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                isLoading={artifactsQuery.isFetching}
              />
            </div>
          )}
        </>
      )}

      {/* Attach Existing Dialog */}
      <Dialog
        open={isAttachDialogOpen}
        onOpenChange={(open) => {
          setIsAttachDialogOpen(open);
          if (!open) {
            setSelectedArtifactId(null);
            setAttachSearch('');
          }
        }}
      >
        <Dialog.Content size="lg">
          <Dialog.Header>
            <Dialog.Title>Attach Existing Document</Dialog.Title>
          </Dialog.Header>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Search your documents..."
              value={attachSearch}
              onChange={(e) => setAttachSearch(e.target.value)}
            />
            <div
              role="listbox"
              aria-label="Available documents"
              className="max-h-64 overflow-auto rounded-lg border border-border"
            >
              {availableArtifactsQuery.isLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  Loading...
                </div>
              )}
              {availableArtifactsQuery.data?.items.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No documents found
                </div>
              )}
              {availableArtifactsQuery.data?.items.map((artifact) => (
                <div
                  key={artifact.id}
                  role="option"
                  aria-selected={selectedArtifactId === artifact.id}
                  tabIndex={0}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 border-b border-border p-3 last:border-b-0 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                    selectedArtifactId === artifact.id &&
                      'bg-muted ring-2 ring-primary ring-inset'
                  )}
                  onClick={() => setSelectedArtifactId(artifact.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedArtifactId(artifact.id);
                    }
                  }}
                >
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Text className="truncate font-medium">
                      {artifact.title}
                    </Text>
                    {artifact.summary && (
                      <Text className="truncate text-sm text-muted-foreground">
                        {artifact.summary}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={() =>
                selectedArtifactId &&
                attachMutation.mutate({
                  projectId,
                  artifactId: selectedArtifactId,
                })
              }
              disabled={!selectedArtifactId || attachMutation.isPending}
            >
              {attachMutation.isPending ? 'Attaching...' : 'Attach'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Create New Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetCreateForm();
          }
        }}
      >
        <Dialog.Content size="2xl" className="h-[80vh] !flex !flex-col">
          <Dialog.Header>
            <Dialog.Title>Create New Document</Dialog.Title>
          </Dialog.Header>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
            <Input
              label="Title"
              placeholder="Document title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Summary (optional)</label>
              <Textarea
                placeholder="Brief description..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Content</label>
                <span
                  className={cn(
                    'text-xs',
                    newContent.length > 1_000_000
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {newContent.length.toLocaleString()} / 1,000,000
                </span>
              </div>
              <Textarea
                placeholder="Document content (Markdown supported)..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[300px]"
              />
              {newContent.length > 1_000_000 && (
                <p className="text-xs text-destructive">
                  Content exceeds maximum length
                </p>
              )}
            </div>
          </div>
          <Dialog.Footer className="mt-auto pt-4 border-t border-border">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={() =>
                createMutation.mutate({
                  title: newTitle.trim(),
                  content: newContent.trim(),
                  summary: newSummary.trim() || undefined,
                })
              }
              disabled={
                !newTitle.trim() ||
                !newContent.trim() ||
                newContent.length > 1_000_000 ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? 'Creating...' : 'Create & Attach'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Detach Confirmation Dialog */}
      <Dialog
        open={!!detachTarget}
        onOpenChange={(open: boolean) => !open && setDetachTarget(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Disconnect Document</Dialog.Title>
            <Dialog.Description>
              Disconnect &ldquo;{detachTarget?.title}&rdquo; from this project?
              The document itself will not be deleted.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={() =>
                detachTarget &&
                detachMutation.mutate({
                  projectId,
                  artifactId: detachTarget.id,
                })
              }
              disabled={detachMutation.isPending}
            >
              {detachMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Document</Dialog.Title>
            <Dialog.Description>
              Permanently delete &ldquo;{deleteTarget?.title}&rdquo;? This
              action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
