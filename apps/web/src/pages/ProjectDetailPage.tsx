import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  Button,
  Tabs,
  Input,
  Dialog,
  Textarea,
  IconButton,
  KanbanBoard,
  TaskListView,
  TaskFilters,
  TaskDetailDialog,
  ToggleGroup,
  Tooltip,
  TooltipProvider,
  type TaskFiltersState,
  type TaskData,
  type PlanningTaskStatus,
  type Priority,
} from '@agent-kit/ui';
import {
  Plus,
  ArrowLeft,
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
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { ArtifactDetailModal } from '../components/artifacts/ArtifactDetailModal';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setActions, setMenuItems, clearActions } = useHeaderActions();

  const [activeTab, setActiveTab] = useState<'backlog' | 'kanban' | 'list'>(
    'kanban'
  );
  const [filters, setFilters] = useState<TaskFiltersState>({});
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [taskDialogMode, setTaskDialogMode] = useState<
    'view' | 'edit' | 'create'
  >('view');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null
  );

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

  const projectQuery = trpc.projects.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const tasksQuery = trpc.tasks.list.useQuery(
    {
      projectId: projectId!,
      priority: filters.priority,
      status: filters.status,
      hasArtifacts: filters.hasArtifacts,
    },
    { enabled: !!projectId }
  );

  const tasksByStatusQuery = trpc.tasks.getByStatus.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      setIsCreateTaskOpen(false);
      resetNewTaskForm();
      utils.tasks.list.invalidate({ projectId: projectId! });
      utils.tasks.getByStatus.invalidate({ projectId: projectId! });
      utils.projects.get.invalidate({ id: projectId! });
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate({ projectId: projectId! });
      utils.tasks.getByStatus.invalidate({ projectId: projectId! });
      utils.projects.get.invalidate({ id: projectId! });
    },
  });

  const moveTaskMutation = trpc.tasks.move.useMutation({
    onMutate: async ({ id, status, position }) => {
      // Cancel any outgoing refetches
      await utils.tasks.getByStatus.cancel({ projectId: projectId! });

      // Snapshot the previous value
      const previousData = utils.tasks.getByStatus.getData({
        projectId: projectId!,
      });

      // Optimistically update the cache
      utils.tasks.getByStatus.setData({ projectId: projectId! }, (old) => {
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
      if (context?.previousData) {
        utils.tasks.getByStatus.setData(
          { projectId: projectId! },
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      utils.tasks.list.invalidate({ projectId: projectId! });
      utils.tasks.getByStatus.invalidate({ projectId: projectId! });
      utils.projects.get.invalidate({ id: projectId! });
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      setSelectedTask(null);
      utils.tasks.list.invalidate({ projectId: projectId! });
      utils.tasks.getByStatus.invalidate({ projectId: projectId! });
      utils.projects.get.invalidate({ id: projectId! });
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      setIsEditProjectOpen(false);
      utils.projects.get.invalidate({ id: projectId! });
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

  // Set header actions and menu items
  useEffect(() => {
    setActions([
      {
        id: 'add-task',
        label: 'Add Task',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setIsCreateTaskOpen(true),
      },
    ]);
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
  }, [setActions, setMenuItems, clearActions]);

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

  // Transform tasks for Backlog view
  const backlogTasks = useMemo(() => {
    if (!tasksByStatusQuery.data?.backlog) return [];
    return tasksByStatusQuery.data.backlog.map((task) => ({
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
          <div className="mb-2 flex items-center gap-2">
            <IconButton
              icon={<ArrowLeft className="h-4 w-4" />}
              label="Back to Projects"
              onClick={() => navigate('/app/projects')}
              variant="ghost"
              size="sm"
            />
            <Heading as="h1" size="20">
              {project.title}
            </Heading>
          </div>
          {project.summary && (
            <Text className="mb-4 text-sm text-muted-foreground">
              {project.summary}
            </Text>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as 'backlog' | 'kanban' | 'list')
              }
            >
              <Tabs.List>
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

            {activeTab !== 'backlog' && (
              <TaskFilters
                filters={filters}
                onFiltersChange={setFilters}
                showStatus={activeTab === 'list'}
                className="flex-1 min-w-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-6xl h-full">
          {activeTab === 'backlog' && (
            <TaskListView
              tasks={backlogTasks}
              onTaskClick={handleTaskClick}
              emptyMessage="No tasks in backlog"
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
              tasks={listTasks}
              onTaskClick={handleTaskClick}
              emptyMessage="No tasks match your filters"
            />
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <Dialog.Content size="lg">
          <Dialog.Header>
            <Dialog.Title>Create New Task</Dialog.Title>
          </Dialog.Header>
          <div className="space-y-4 py-4">
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
                rows={3}
              />
            </div>
            <TooltipProvider>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Status
                  </label>
                  <ToggleGroup
                    value={newTaskStatus}
                    onValueChange={(v) =>
                      setNewTaskStatus(v as PlanningTaskStatus)
                    }
                    size="sm"
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
                      <ToggleGroup.Item value="in_progress" colorScheme="blue">
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
                  <label className="block text-sm font-medium text-foreground">
                    Priority
                  </label>
                  <ToggleGroup
                    value={newTaskPriority}
                    onValueChange={(v) => setNewTaskPriority(v as Priority)}
                    size="sm"
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
              </div>
            </TooltipProvider>
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

      {/* Task Detail Dialog */}
      <TaskDetailDialog
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
        onArtifactClick={setSelectedArtifactId}
      />

      {/* Artifact Detail Modal */}
      <ArtifactDetailModal
        artifactId={selectedArtifactId}
        onClose={() => setSelectedArtifactId(null)}
        onDownload={(artifact) => {
          const blob = new Blob([artifact.content], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${artifact.title}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <Dialog.Content size="sm">
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
    </div>
  );
}
