import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  Button,
  Input,
  Dialog,
  Textarea,
  Pagination,
  ProjectCard,
} from '@agent-kit/ui';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { setActions, clearActions } = useHeaderActions();
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectSummary, setNewProjectSummary] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);
  const currentCursor = cursors[cursors.length - 1];

  useEffect(() => {
    document.title = 'Projects | Agent Kit';
  }, []);

  // Set header actions
  useEffect(() => {
    setActions([
      {
        id: 'new-project',
        label: 'New Project',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setIsCreateDialogOpen(true),
      },
    ]);
    return () => clearActions();
  }, [setActions, clearActions]);

  // Reset pagination when search changes
  useEffect(() => {
    setCursors([]);
  }, [debouncedSearch]);

  const projectsQuery = trpc.projects.list.useQuery({
    limit: 12,
    cursor: currentCursor,
    search: debouncedSearch || undefined,
  });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (newProject) => {
      setIsCreateDialogOpen(false);
      setNewProjectTitle('');
      setNewProjectSummary('');
      projectsQuery.refetch();
      navigate(`/app/projects/${newProject.id}`);
    },
  });

  const handleNextPage = useCallback(() => {
    if (projectsQuery.data?.nextCursor) {
      setCursors([...cursors, projectsQuery.data.nextCursor]);
    }
  }, [projectsQuery.data?.nextCursor, cursors]);

  const handlePreviousPage = useCallback(() => {
    setCursors(cursors.slice(0, -1));
  }, [cursors]);

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return;
    createMutation.mutate({
      title: newProjectTitle.trim(),
      summary: newProjectSummary.trim() || undefined,
    });
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/app/projects/${projectId}`);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Projects
          </Heading>
          <Text className="text-muted-foreground">
            Organize your work with Kanban boards and task management
          </Text>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {projectsQuery.isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-border bg-muted/30"
              />
            ))}
          </div>
        )}

        {/* Content */}
        {projectsQuery.data && (
          <>
            {projectsQuery.data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {debouncedSearch ? (
                  <>
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No projects found</Text>
                    <Text className="text-sm text-muted-foreground">
                      Try a different search term
                    </Text>
                  </>
                ) : (
                  <>
                    <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
                    <Text className="font-medium">No projects yet</Text>
                    <Text className="mb-4 text-sm text-muted-foreground">
                      Create your first project to get started
                    </Text>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" />
                      Create Project
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projectsQuery.data.items.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    summary={project.summary}
                    taskCounts={project.taskCounts}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {(projectsQuery.data.nextCursor || cursors.length > 0) && (
              <div className="mt-6">
                <Pagination
                  hasNextPage={!!projectsQuery.data.nextCursor}
                  hasPreviousPage={cursors.length > 0}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
                  isLoading={projectsQuery.isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Content
          size="2xl"
          className="h-[80vh] flex flex-col overflow-hidden"
        >
          <Dialog.Header>
            <Dialog.Title>Create New Project</Dialog.Title>
            <Dialog.Description>
              Create a new project to organize your tasks with a Kanban board.
            </Dialog.Description>
          </Dialog.Header>
          <div className="space-y-4 py-4">
            <Input
              label="Project Title"
              placeholder="Enter project title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Summary (optional)
              </label>
              <Textarea
                placeholder="Brief description of the project"
                value={newProjectSummary}
                onChange={(e) => setNewProjectSummary(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={handleCreateProject}
              isLoading={createMutation.isPending}
              disabled={!newProjectTitle.trim()}
            >
              Create Project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
