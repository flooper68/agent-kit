import { useState, useEffect, useCallback, useMemo } from 'react';
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
  DropdownMenu,
  Select,
  cn,
  useToast,
} from '@agent-kit/ui';
import {
  FileText,
  Trash2,
  Search,
  MoreHorizontal,
  FolderPlus,
  ListPlus,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useUrlState } from '../hooks/useUrlState';

export function ArtifactsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [cursors, setCursors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [attachProjectTarget, setAttachProjectTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [attachTaskTarget, setAttachTaskTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectDialogSearch, setProjectDialogSearch] = useState('');
  const [searchQuery, setSearchQuery, debouncedSearch] = useUrlState('search', {
    debounceMs: 300,
  });
  const [projectFilter, setProjectFilter] = useUrlState('project', {
    defaultValue: 'all',
  });
  const currentCursor = cursors[cursors.length - 1];
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Artifacts | Agent Kit';
  }, []);

  // Reset pagination when search or project filter changes
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch, projectFilter]);

  // Projects query (used for filter dropdown and attachment dialogs)
  const projectsQuery = trpc.projects.list.useQuery({ limit: 50 });

  // Filtered projects for dialogs (client-side search for better UX with many projects)
  const filteredProjects = useMemo(() => {
    const projects = projectsQuery.data?.items ?? [];
    if (!projectDialogSearch.trim()) return projects;
    const query = projectDialogSearch.toLowerCase();
    return projects.filter((p) => p.title.toLowerCase().includes(query));
  }, [projectsQuery.data?.items, projectDialogSearch]);

  // Conditional query logic: use different queries based on project filter
  const isUncategorized = projectFilter === 'uncategorized';
  const isProjectFiltered =
    projectFilter !== 'all' && projectFilter !== 'uncategorized';

  const allArtifactsQuery = trpc.artifacts.list.useQuery(
    {
      limit: 25,
      cursor: currentCursor,
      search: debouncedSearch || undefined,
      uncategorized: isUncategorized || undefined,
    },
    { enabled: !isProjectFiltered }
  );

  const projectArtifactsQuery = trpc.projects.listArtifacts.useQuery(
    {
      projectId: projectFilter,
      limit: 25,
      cursor: currentCursor,
      search: debouncedSearch || undefined,
    },
    { enabled: isProjectFiltered }
  );

  // Unified query result
  const artifactsQuery = isProjectFiltered
    ? projectArtifactsQuery
    : allArtifactsQuery;

  const deleteMutation = trpc.artifacts.delete.useMutation({
    onSuccess: () => {
      // Use queueMicrotask to ensure Radix UI Dialog can properly clean up
      queueMicrotask(() => {
        setDeleteTarget(null);
      });
      utils.artifacts.list.invalidate();
      if (isProjectFiltered) {
        utils.projects.listArtifacts.invalidate({ projectId: projectFilter });
      }
    },
  });
  const tasksQuery = trpc.tasks.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId && !!attachTaskTarget }
  );

  // Mutations for attaching artifacts
  const attachToProjectMutation = trpc.projects.attachArtifact.useMutation({
    onSuccess: (_data, variables) => {
      queueMicrotask(() => {
        setAttachProjectTarget(null);
        setSelectedProjectId(null);
      });
      utils.artifacts.list.invalidate();
      utils.projects.listArtifacts.invalidate({
        projectId: variables.projectId,
      });
      addToast({
        message: 'Artifact attached to project',
        variant: 'success',
      });
    },
  });

  const attachToTaskMutation = trpc.tasks.attachArtifact.useMutation({
    onSuccess: (_data, variables) => {
      queueMicrotask(() => {
        setAttachTaskTarget(null);
        setSelectedProjectId(null);
        setSelectedTaskId(null);
      });
      utils.artifacts.list.invalidate();
      utils.tasks.get.invalidate({ id: variables.taskId });
      addToast({
        message: 'Artifact attached to task',
        variant: 'success',
      });
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

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={projectFilter}
            onValueChange={setProjectFilter}
            options={[
              { value: 'all', label: 'All Projects' },
              { value: 'uncategorized', label: 'Uncategorized' },
              ...(projectsQuery.data?.items ?? []).map((project) => ({
                value: project.id,
                label: project.title,
              })),
            ]}
            className="w-48"
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
                                setAttachProjectTarget({
                                  id: artifact.id,
                                  title: artifact.title,
                                })
                              }
                            >
                              <FolderPlus className="h-4 w-4" />
                              Attach to project
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() =>
                                setAttachTaskTarget({
                                  id: artifact.id,
                                  title: artifact.title,
                                })
                              }
                            >
                              <ListPlus className="h-4 w-4" />
                              Attach to task
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

      {/* Attach to Project Dialog */}
      <Dialog
        open={!!attachProjectTarget}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setAttachProjectTarget(null);
            setSelectedProjectId(null);
            setProjectDialogSearch('');
          }
        }}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Attach to Project</Dialog.Title>
            <Dialog.Description>
              Select a project to attach &ldquo;{attachProjectTarget?.title}
              &rdquo; to.
            </Dialog.Description>
          </Dialog.Header>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={projectDialogSearch}
              onChange={(e) => setProjectDialogSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {projectsQuery.isLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <Text className="p-4 text-center text-muted-foreground">
                {projectDialogSearch
                  ? 'No matching projects'
                  : 'No projects found'}
              </Text>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'cursor-pointer rounded-md p-2 hover:bg-muted',
                    selectedProjectId === project.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <Text className="font-medium">{project.title}</Text>
                </div>
              ))
            )}
          </div>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              disabled={!selectedProjectId || attachToProjectMutation.isPending}
              onClick={() => {
                if (attachProjectTarget && selectedProjectId) {
                  attachToProjectMutation.mutate({
                    projectId: selectedProjectId,
                    artifactId: attachProjectTarget.id,
                  });
                }
              }}
            >
              Attach
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Attach to Task Dialog */}
      <Dialog
        open={!!attachTaskTarget}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setAttachTaskTarget(null);
            setSelectedProjectId(null);
            setSelectedTaskId(null);
            setProjectDialogSearch('');
          }
        }}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Attach to Task</Dialog.Title>
            <Dialog.Description>
              {!selectedProjectId
                ? 'First, select a project.'
                : 'Now select a task to attach to.'}
            </Dialog.Description>
          </Dialog.Header>
          {!selectedProjectId && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={projectDialogSearch}
                onChange={(e) => setProjectDialogSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
            {!selectedProjectId ? (
              // Step 1: Select project
              projectsQuery.isLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-md bg-muted"
                    />
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <Text className="p-4 text-center text-muted-foreground">
                  {projectDialogSearch
                    ? 'No matching projects'
                    : 'No projects found'}
                </Text>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="cursor-pointer rounded-md p-2 hover:bg-muted"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setProjectDialogSearch('');
                    }}
                  >
                    <Text className="font-medium">{project.title}</Text>
                  </div>
                ))
              )
            ) : // Step 2: Select task
            tasksQuery.isLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : tasksQuery.data?.length === 0 ? (
              <Text className="p-4 text-center text-muted-foreground">
                No tasks found in this project
              </Text>
            ) : (
              tasksQuery.data?.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'cursor-pointer rounded-md p-2 hover:bg-muted',
                    selectedTaskId === task.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <Text className="font-medium">{task.title}</Text>
                </div>
              ))
            )}
          </div>
          <Dialog.Footer>
            {selectedProjectId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedProjectId(null);
                  setSelectedTaskId(null);
                }}
              >
                Back
              </Button>
            )}
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              disabled={!selectedTaskId || attachToTaskMutation.isPending}
              onClick={() => {
                if (attachTaskTarget && selectedTaskId) {
                  attachToTaskMutation.mutate({
                    taskId: selectedTaskId,
                    artifactId: attachTaskTarget.id,
                  });
                }
              }}
            >
              Attach
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
