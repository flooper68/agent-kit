import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  DataList,
  Pagination,
  IconButton,
  Dialog,
  Button,
  Input,
} from '@agent-kit/ui';
import { FileText, Trash2, Search } from 'lucide-react';
import { trpc } from '../lib/trpc';

/**
 * Custom hook for debouncing a value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function ArtifactsPage() {
  const navigate = useNavigate();
  const [cursors, setCursors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const currentCursor = cursors[cursors.length - 1];
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Artifacts | Agent Kit';
  }, []);

  // Reset pagination when search changes
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch]);

  const artifactsQuery = trpc.artifacts.list.useQuery({
    limit: 25,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
  });

  const deleteMutation = trpc.artifacts.delete.useMutation({
    onSuccess: () => {
      // Use queueMicrotask to ensure Radix UI Dialog can properly clean up
      queueMicrotask(() => {
        setDeleteTarget(null);
      });
      utils.artifacts.list.invalidate();
    },
  });

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
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Artifacts
          </Heading>
          <Text className="text-muted-foreground">
            Documents and notes saved by your AI assistants
          </Text>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search artifacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {artifactsQuery.isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {artifactsQuery.data && (
          <>
            {artifactsQuery.data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {debouncedSearch ? (
                  <>
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No matches found</Text>
                    <Text className="text-sm text-muted-foreground">
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No artifacts yet</Text>
                    <Text className="text-sm text-muted-foreground">
                      Ask an AI assistant to save a document for you
                    </Text>
                  </>
                )}
              </div>
            ) : (
              <DataList>
                {artifactsQuery.data.items.map((artifact) => (
                  <DataList.Item
                    key={artifact.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/app/artifacts/${artifact.id}`)}
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
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() =>
                            setDeleteTarget({
                              id: artifact.id,
                              title: artifact.title,
                            })
                          }
                          label="Delete"
                          size="sm"
                          variant="destructive"
                        />
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
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Artifact</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}
              &rdquo;? This action cannot be undone.
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
            >
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
