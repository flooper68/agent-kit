import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from 'react-router-dom';
import {
  Heading,
  Text,
  Button,
  Tabs,
  Input,
  Dialog,
  Textarea,
  KanbanBoard,
  TaskListView,
  TaskFilters,
  TaskDetailDialog,
  ToggleGroup,
  Tooltip,
  TooltipProvider,
  useToast,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskFiltersState,
  type TaskData,
  type PlanningTaskStatus,
  type Priority,
} from '@agent-kit/ui';
import {
  Plus,
  ChevronRight,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Inbox,
  Circle,
  Clock,
  Eye,
  CheckCircle,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
  FileText,
  Link2,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { ProjectDocumentsTab } from '../components/ProjectDocumentsTab';
import { useUrlState } from '../hooks/useUrlState';

type TabValue = 'backlog' | 'kanban' | 'list' | 'documents';

const tabLabels: Record<TabValue, string> = {
  kanban: 'Board',
  backlog: 'Backlog',
  list: 'List',
  documents: 'Documents',
};

const validTabs: TabValue[] = ['documents', 'kanban', 'backlog', 'list'];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setActions, setMenuItems, clearActions } = useHeaderActions();
  const { addToast } = useToast();

  // Read tab from URL search params, default to 'documents'
  const tabParam = searchParams.get('tab') as TabValue | null;
  const activeTab =
    tabParam && validTabs.includes(tabParam) ? tabParam : 'documents';

  const handleTabChange = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        next.set('tab', tab);

        // Preserve list tab filters when switching TO list
        if (tab === 'list') {
          ['search', 'priority', 'status', 'hasArtifacts'].forEach((param) => {
            const value = prev.get(param);
            if (value) next.set(param, value);
          });
        }

        // Preserve doc search when switching TO documents
        if (tab === 'documents') {
          const docSearch = prev.get('docSearch');
          if (docSearch) next.set('docSearch', docSearch);
        }

        return next;
      },
      { replace: true }
    );
  };

  // URL state for task filters (list tab)
  const [searchQuery, setSearchQuery, debouncedSearchQuery] = useUrlState(
    'search',
    { debounceMs: 300 }
  );
  const [priority, setPriority] = useUrlState<Priority | undefined>(
    'priority',
    {
      parse: (v) =>
        v && ['low', 'medium', 'high', 'urgent'].includes(v)
          ? (v as Priority)
          : undefined,
    }
  );
  const [status, setStatus] = useUrlState<PlanningTaskStatus | undefined>(
    'status',
    {
      parse: (v) =>
        v && ['backlog', 'todo', 'in_progress', 'review', 'done'].includes(v)
          ? (v as PlanningTaskStatus)
          : undefined,
    }
  );
  const [hasArtifacts, setHasArtifacts] = useUrlState<boolean | undefined>(
    'hasArtifacts',
    {
      parse: (v) => (v === 'true' ? true : undefined),
      serialize: (v) => (v ? 'true' : undefined),
    }
  );

  // Compose filters object for TaskFilters component
  const filters: TaskFiltersState = useMemo(
    () => ({
      searchQuery: searchQuery || undefined,
      priority,
      status,
      hasArtifacts,
    }),
    [searchQuery, priority, status, hasArtifacts]
  );

  const setFilters = useCallback((newFilters: TaskFiltersState) => {
    setSearchQuery(newFilters.searchQuery ?? '');
    setPriority(newFilters.priority);
    setStatus(newFilters.status);
    setHasArtifacts(newFilters.hasArtifacts);
  }, [setSearchQuery, setPriority, setStatus, setHasArtifacts]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDocumentAttachOpen, setIsDocumentAttachOpen] = useState(false);
  const [isDocumentCreateOpen, setIsDocumentCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [taskDialogMode, setTaskDialogMode] = useState<
    'view' | 'edit' | 'create'
  >('view');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Form state for new task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskStatus, setNewTaskStatus] =
    useState<PlanningTaskStatus>('backlog');

  // Form state for edit project
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectSummary, setEditProjectSummary] = useState('');

  const utils = trpc.useUtils();

  // Redirect to projects list if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/app/projects');
    }
  }, [projectId, navigate]);

  const projectQuery = trpc.projects.get.useQuery(
    { id: projectId ?? '' },
    { enabled: !!projectId }
  );

  const tasksQuery = trpc.tasks.list.useQuery(
    {
      projectId: projectId ?? '',
      priority: filters.priority,
      status: filters.status,
      hasArtifacts: filters.hasArtifacts,
    },
    { enabled: !!projectId }
  );

  const tasksByStatusQuery = trpc.tasks.getByStatus.useQuery(
    { projectId: projectId ?? '' },
    { enabled: !!projectId }
  );

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      if (!projectId) return;
      setIsCreateTaskOpen(false);
      resetNewTaskForm();
      utils.tasks.list.invalidate({ projectId });
      utils.tasks.getByStatus.invalidate({ projectId });
      utils.projects.get.invalidate({ id: projectId });
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      if (!projectId) return;
      utils.tasks.list.invalidate({ projectId });
      utils.tasks.getByStatus.invalidate({ projectId });
      utils.projects.get.invalidate({ id: projectId });
    },
  });

  const moveTaskMutation = trpc.tasks.move.useMutation({
    onMutate: async ({ id, status, position }) => {
      if (!projectId) return;
      // Cancel any outgoing refetches
      await utils.tasks.getByStatus.cancel({ projectId });

      // Snapshot the previous value
      const previousData = utils.tasks.getByStatus.getData({
        projectId,
      });

      // Optimistically update the cache
      utils.tasks.getByStatus.setData({ projectId }, (old) => {
        if (!old) return old;

        // Find the task in any column
        let movedTask: (typeof old.todo)[0] | undefined;
        const statuses = [
          'backlog',
          'todo',
          'in_progress',
          'review',
          'done',
        ] as const;

        for (const s of statuses) {
          const idx = old[s].findIndex((t) => t.id === id);
          if (idx !== -1) {
            movedTask = old[s][idx];
            break;
          }
        }

        if (!movedTask) return old;

        // Create new state with the task moved
        const newData = { ...old };
        for (const s of statuses) {
          newData[s] = old[s].filter((t) => t.id !== id);
        }

        // Insert at new position
        const updatedTask = { ...movedTask, status, position };
        const targetList = [...newData[status]];
        targetList.splice(position, 0, updatedTask);

        // Update positions for all tasks in target column
        newData[status] = targetList.map((t, i) => ({ ...t, position: i }));

        return newData;
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData && projectId) {
        utils.tasks.getByStatus.setData({ projectId }, context.previousData);
      }
      addToast({
        message: 'Failed to move task. Please try again.',
        variant: 'error',
      });
    },
    onSettled: () => {
      if (!projectId) return;
      // Refetch after mutation settles
      utils.tasks.list.invalidate({ projectId });
      utils.tasks.getByStatus.invalidate({ projectId });
      utils.projects.get.invalidate({ id: projectId });
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      if (!projectId) return;
      setSelectedTask(null);
      utils.tasks.list.invalidate({ projectId });
      utils.tasks.getByStatus.invalidate({ projectId });
      utils.projects.get.invalidate({ id: projectId });
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      if (!projectId) return;
      setIsEditProjectOpen(false);
      utils.projects.get.invalidate({ id: projectId });
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      navigate('/app/projects');
    },
  });

  useEffect(() => {
    if (projectQuery.data) {
      document.title = `${projectQuery.data.title} | Agent Kit`;
      setEditProjectTitle(projectQuery.data.title);
      setEditProjectSummary(projectQuery.data.summary || '');
    }
  }, [projectQuery.data]);

  // Set header actions and menu items based on active tab
  useEffect(() => {
    if (activeTab === 'documents') {
      setActions([
        {
          id: 'attach-document',
          label: 'Attach Existing',
          icon: <Link2 className="h-4 w-4" />,
          onClick: () => setIsDocumentAttachOpen(true),
          variant: 'outline',
        },
        {
          id: 'create-document',
          label: 'Create New',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setIsDocumentCreateOpen(true),
        },
      ]);
    } else {
      setActions([
        {
          id: 'add-task',
          label: 'Add Task',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setIsCreateTaskOpen(true),
        },
      ]);
    }
    setMenuItems([
      {
        id: 'edit-project',
        label: 'Edit Project',
        icon: <Edit2 className="h-4 w-4" />,
        onClick: () => setIsEditProjectOpen(true),
      },
      {
        id: 'delete-project',
        label: 'Delete Project',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => setIsDeleteProjectOpen(true),
        danger: true,
      },
    ]);
    return () => clearActions();
  }, [activeTab, setActions, setMenuItems, clearActions]);

  const resetNewTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskStatus('backlog');
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !projectId) return;
    createTaskMutation.mutate({
      projectId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      status: newTaskStatus,
    });
  };

  // Transform tasks for KanbanBoard
  const kanbanTasks = useMemo(() => {
    if (!tasksByStatusQuery.data) return [];
    const allTasks = [
      ...tasksByStatusQuery.data.todo,
      ...tasksByStatusQuery.data.in_progress,
      ...tasksByStatusQuery.data.review,
      ...tasksByStatusQuery.data.done,
    ];
    return allTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority as Priority,
      status: task.status as PlanningTaskStatus,
      position: task.position,
      artifactCount: task.artifactCount,
    }));
  }, [tasksByStatusQuery.data]);

  // Transform tasks for Backlog view (sorted by position for DnD)
  // Use createdAt as secondary sort to handle duplicate positions
  const backlogTasks = useMemo(() => {
    if (!tasksByStatusQuery.data?.backlog) return [];
    return tasksByStatusQuery.data.backlog
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as PlanningTaskStatus,
        priority: task.priority as Priority,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        artifactCount: task.artifactCount,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        position: task.position,
      }))
      .sort((a, b) => {
        // Primary sort by position, secondary by createdAt for deterministic order
        const positionDiff = a.position - b.position;
        if (positionDiff !== 0) return positionDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [tasksByStatusQuery.data]);

  // Transform tasks for TaskListView
  const listTasks = useMemo(() => {
    if (!tasksQuery.data) return [];
    return tasksQuery.data.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as PlanningTaskStatus,
      priority: task.priority as Priority,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      artifactCount: task.artifactCount,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));
  }, [tasksQuery.data]);

  // Filter list tasks by search query
  const filteredListTasks = useMemo(() => {
    if (!debouncedSearchQuery) return listTasks;
    const query = debouncedSearchQuery.toLowerCase();
    return listTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    );
  }, [listTasks, debouncedSearchQuery]);

  const handleTaskMove = useCallback(
    (taskId: string, newStatus: PlanningTaskStatus, newPosition: number) => {
      moveTaskMutation.mutate({
        id: taskId,
        status: newStatus,
        position: newPosition,
      });
    },
    [moveTaskMutation]
  );

  // Handler for backlog DnD reordering (status stays 'backlog')
  const handleBacklogMove = useCallback(
    (taskId: string, newPosition: number) => {
      handleTaskMove(taskId, 'backlog', newPosition);
    },
    [handleTaskMove]
  );

  const handleTaskClick = useCallback(
    async (taskId: string) => {
      // Fetch full task details including artifacts
      const fullTask = await utils.tasks.get.fetch({ id: taskId });
      if (fullTask) {
        setSelectedTask({
          id: fullTask.id,
          title: fullTask.title,
          description: fullTask.description,
          status: fullTask.status as PlanningTaskStatus,
          priority: fullTask.priority as Priority,
          completedAt: fullTask.completedAt
            ? new Date(fullTask.completedAt)
            : null,
          createdAt: new Date(fullTask.createdAt),
          updatedAt: new Date(fullTask.updatedAt),
          artifacts: fullTask.artifacts?.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.format,
          })),
          events: fullTask.events,
        });
        setTaskDialogMode('edit');
      }
    },
    [utils.tasks.get]
  );

  // Handler for quick status change from context menu
  const handleTaskStatusChange = useCallback(
    (taskId: string, status: PlanningTaskStatus) => {
      updateTaskMutation.mutate({ id: taskId, status });
    },
    [updateTaskMutation]
  );

  // Handler for quick priority change from context menu
  const handleTaskPriorityChange = useCallback(
    (taskId: string, priority: Priority) => {
      updateTaskMutation.mutate({ id: taskId, priority });
    },
    [updateTaskMutation]
  );

  // Handler for delete request from context menu (shows confirmation)
  const handleTaskDeleteRequest = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
  }, []);

  // Handler for confirming task deletion
  const handleConfirmTaskDelete = useCallback(() => {
    if (taskToDelete) {
      deleteTaskMutation.mutate({ id: taskToDelete });
      setTaskToDelete(null);
    }
  }, [taskToDelete, deleteTaskMutation]);

  const handleTaskSave = async (data: Partial<TaskData>) => {
    if (!selectedTask?.id) return;

    // Update title, description, priority, and status
    await updateTaskMutation.mutateAsync({
      id: selectedTask.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
    });

    // Update selectedTask to reflect the new status
    if (data.status && data.status !== selectedTask.status) {
      setSelectedTask((prev) =>
        prev ? { ...prev, status: data.status! } : null
      );
    }
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTaskMutation.mutate({ id: taskId });
  };

  const handleUpdateProject = () => {
    if (!editProjectTitle.trim() || !projectId) return;
    updateProjectMutation.mutate({
      id: projectId,
      title: editProjectTitle.trim(),
      summary: editProjectSummary.trim() || undefined,
    });
  };

  const handleDeleteProject = () => {
    if (!projectId) return;
    deleteProjectMutation.mutate({ id: projectId });
  };

  if (projectQuery.isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mb-4 h-4 w-64 animate-pulse rounded bg-muted" />
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-96 w-72 flex-shrink-0 animate-pulse rounded-lg bg-muted/30"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!projectQuery.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Text className="font-medium">Project not found</Text>
          <Button
            variant="link"
            onClick={() => navigate('/app/projects')}
            className="mt-2"
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb navigation */}
          <nav className="mb-3 flex items-center gap-1.5">
            <Link
              to="/app/projects"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="max-w-xs truncate text-sm text-muted-foreground">
              {project.title}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm font-medium">{tabLabels[activeTab]}</span>
          </nav>
          <Heading as="h1" size="24">
            {project.title}
          </Heading>
          {project.summary && (
            <Text className="mb-4 text-sm text-muted-foreground">
              {project.summary}
            </Text>
          )}

          {/* Toolbar */}
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <Tabs.List>
                <Tabs.Trigger value="documents">
                  <FileText className="mr-1 h-4 w-4" />
                  Documents
                </Tabs.Trigger>
                <Tabs.Trigger value="kanban">
                  <LayoutGrid className="mr-1 h-4 w-4" />
                  Board
                </Tabs.Trigger>
                <Tabs.Trigger value="backlog">
                  <Inbox className="mr-1 h-4 w-4" />
                  Backlog
                </Tabs.Trigger>
                <Tabs.Trigger value="list">
                  <List className="mr-1 h-4 w-4" />
                  List
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs>

            {activeTab === 'list' && (
              <TaskFilters
                filters={filters}
                onFiltersChange={setFilters}
                showStatus
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-6">
        <div className="mx-auto max-w-6xl h-full">
          {activeTab === 'backlog' && (
            <TaskListView
              tasks={backlogTasks}
              onTaskClick={handleTaskClick}
              onEdit={handleTaskClick}
              onStatusChange={handleTaskStatusChange}
              onPriorityChange={handleTaskPriorityChange}
              onDelete={handleTaskDeleteRequest}
              emptyMessage="No tasks in backlog"
              sortable
              onTaskMove={handleBacklogMove}
            />
          )}
          {activeTab === 'kanban' && (
            <KanbanBoard
              tasks={kanbanTasks}
              onTaskMove={handleTaskMove}
              onTaskClick={handleTaskClick}
              className="h-full"
            />
          )}
          {activeTab === 'list' && (
            <TaskListView
              tasks={filteredListTasks}
              onTaskClick={handleTaskClick}
              onEdit={handleTaskClick}
              onStatusChange={handleTaskStatusChange}
              onPriorityChange={handleTaskPriorityChange}
              onDelete={handleTaskDeleteRequest}
              emptyMessage="No tasks match your filters"
            />
          )}
          {activeTab === 'documents' && projectId && (
            <ProjectDocumentsTab
              projectId={projectId}
              isAttachDialogOpen={isDocumentAttachOpen}
              onAttachDialogOpenChange={setIsDocumentAttachOpen}
              isCreateDialogOpen={isDocumentCreateOpen}
              onCreateDialogOpenChange={setIsDocumentCreateOpen}
            />
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <Dialog.Content
          size="2xl"
          className="h-[80vh] flex flex-col overflow-hidden"
        >
          <Dialog.Header>
            <Dialog.Title>Create New Task</Dialog.Title>
          </Dialog.Header>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-[1fr,auto] gap-6">
              {/* Left column - Title and Description */}
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description (optional)
                  </label>
                  <Textarea
                    placeholder="Task description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>
              </div>

              {/* Right column - Status and Priority */}
              <div className="w-56 space-y-6">
                <TooltipProvider>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground">
                        Status
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {STATUS_LABELS[newTaskStatus]}
                      </span>
                    </div>
                    <ToggleGroup
                      value={newTaskStatus}
                      onValueChange={(v) =>
                        setNewTaskStatus(v as PlanningTaskStatus)
                      }
                      size="sm"
                      className="flex-wrap"
                    >
                      <Tooltip content="Backlog">
                        <ToggleGroup.Item value="backlog" colorScheme="slate">
                          <Inbox className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="Todo">
                        <ToggleGroup.Item value="todo">
                          <Circle className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="In Progress">
                        <ToggleGroup.Item
                          value="in_progress"
                          colorScheme="blue"
                        >
                          <Clock className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="Review">
                        <ToggleGroup.Item value="review" colorScheme="amber">
                          <Eye className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="Done">
                        <ToggleGroup.Item value="done" colorScheme="green">
                          <CheckCircle className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                    </ToggleGroup>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground">
                        Priority
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {PRIORITY_LABELS[newTaskPriority]}
                      </span>
                    </div>
                    <ToggleGroup
                      value={newTaskPriority}
                      onValueChange={(v) => setNewTaskPriority(v as Priority)}
                      size="sm"
                      className="flex-wrap"
                    >
                      <Tooltip content="Low">
                        <ToggleGroup.Item value="low" colorScheme="green">
                          <ArrowDown className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="Medium">
                        <ToggleGroup.Item value="medium" colorScheme="amber">
                          <Minus className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="High">
                        <ToggleGroup.Item value="high" colorScheme="orange">
                          <ArrowUp className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                      <Tooltip content="Urgent">
                        <ToggleGroup.Item value="urgent" colorScheme="red">
                          <AlertTriangle className="h-4 w-4" />
                        </ToggleGroup.Item>
                      </Tooltip>
                    </ToggleGroup>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={handleCreateTask}
              isLoading={createTaskMutation.isPending}
              disabled={!newTaskTitle.trim()}
            >
              Create Task
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Task Detail Dialog - key ensures complete state reset when switching tasks */}
      <TaskDetailDialog
        key={selectedTask?.id ?? 'new'}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setTaskDialogMode('view');
          }
        }}
        task={selectedTask}
        mode={taskDialogMode}
        onModeChange={setTaskDialogMode}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        isSaving={updateTaskMutation.isPending}
        isDeleting={deleteTaskMutation.isPending}
        autoSave
        autoSaveDelay={800}
        onArtifactClick={(artifactId) =>
          navigate(`/app/artifacts/${artifactId}`)
        }
      />

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <Dialog.Content
          size="2xl"
          className="h-[80vh] flex flex-col overflow-hidden"
        >
          <Dialog.Header>
            <Dialog.Title>Edit Project</Dialog.Title>
          </Dialog.Header>
          <div className="space-y-4 py-4">
            <Input
              label="Title"
              value={editProjectTitle}
              onChange={(e) => setEditProjectTitle(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Summary (optional)
              </label>
              <Textarea
                value={editProjectSummary}
                onChange={(e) => setEditProjectSummary(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={handleUpdateProject}
              isLoading={updateProjectMutation.isPending}
              disabled={!editProjectTitle.trim()}
            >
              Save Changes
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteProjectOpen} onOpenChange={setIsDeleteProjectOpen}>
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Project</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete &ldquo;{project.title}&rdquo;?
              This will also delete all tasks in this project. This action
              cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              isLoading={deleteProjectMutation.isPending}
            >
              Delete Project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Task</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              onClick={handleConfirmTaskDelete}
              isLoading={deleteTaskMutation.isPending}
            >
              Delete Task
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
