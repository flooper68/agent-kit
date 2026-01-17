import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  DataList,
  Pagination,
  Button,
  Input,
  Dialog,
  IconButton,
  DropdownMenu,
} from '@agent-kit/ui';
import {
  Slash,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { useUrlState } from '../hooks/useUrlState';

export function SlashCommandsPage() {
  const navigate = useNavigate();
  const { setActions, clearActions } = useHeaderActions();
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery, debouncedSearch] = useUrlState('search', {
    debounceMs: 300,
  });

  // Dialog states
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const currentCursor = cursors[cursors.length - 1];
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Commands | Agent Kit';
  }, []);

  // Header action
  useEffect(() => {
    setActions([
      {
        id: 'create-command',
        label: 'New Command',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => navigate('/app/commands/new'),
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions, navigate]);

  // Reset pagination on search
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch]);

  const commandsQuery = trpc.slashCommands.list.useQuery({
    limit: 25,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
  });

  const deleteMutation = trpc.slashCommands.delete.useMutation({
    onSuccess: () => {
      queueMicrotask(() => setDeleteTarget(null));
      utils.slashCommands.list.invalidate();
    },
  });

  const handleNextPage = useCallback(() => {
    if (commandsQuery.data?.nextCursor) {
      setCursors([...cursors, commandsQuery.data.nextCursor]);
    }
  }, [commandsQuery.data?.nextCursor, cursors]);

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

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Commands
          </Heading>
          <Text className="text-muted-foreground">
            Create custom slash commands to quickly insert prompts
          </Text>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {commandsQuery.isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Content */}
        {commandsQuery.data && (
          <>
            {commandsQuery.data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {debouncedSearch ? (
                  <>
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No commands found</Text>
                    <Text className="text-sm text-muted-foreground">
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <Slash className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No commands yet</Text>
                    <Text className="mb-4 text-sm text-muted-foreground">
                      Create your first slash command to get started
                    </Text>
                    <Button onClick={() => navigate('/app/commands/new')}>
                      <Plus className="mr-1 h-4 w-4" />
                      Create Command
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <DataList>
                {commandsQuery.data.items.map((command) => (
                  <DataList.Item
                    key={command.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/app/commands/${command.id}/edit`)}
                  >
                    <DataList.Cell shrink>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Slash className="h-4 w-4" />
                      </div>
                    </DataList.Cell>
                    <DataList.Cell grow>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Text className="font-mono text-primary">
                            /{command.key}
                          </Text>
                          <Text className="truncate font-medium">
                            {command.name}
                          </Text>
                        </div>
                        {command.description && (
                          <Text className="truncate text-sm text-muted-foreground">
                            {command.description}
                          </Text>
                        )}
                      </div>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <Text className="text-sm text-muted-foreground">
                        {formatDate(command.createdAt)}
                      </Text>
                    </DataList.Cell>
                    <DataList.Cell shrink>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenu.Trigger asChild>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              icon={<MoreHorizontal className="h-4 w-4" />}
                              label="Actions"
                            />
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content align="end">
                            <DropdownMenu.Item
                              onSelect={() =>
                                navigate(`/app/commands/${command.id}/edit`)
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() =>
                                setDeleteTarget({
                                  id: command.id,
                                  name: command.name,
                                })
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
            {(commandsQuery.data.nextCursor || cursors.length > 0) && (
              <div className="mt-4">
                <Pagination
                  hasNextPage={!!commandsQuery.data.nextCursor}
                  hasPreviousPage={cursors.length > 0}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
                  isLoading={commandsQuery.isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete Command</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate({ id: deleteTarget.id });
                }
              }}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
