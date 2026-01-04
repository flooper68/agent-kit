import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, FolderKanban } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Spinner } from '../Spinner';

export interface Project {
  id: string;
  name: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

export interface ProjectSwitcherProps {
  /** List of available projects */
  projects: Project[];
  /** Currently selected project */
  currentProject: Project;
  /** Callback when a project is selected */
  onSelect: (projectId: string) => void;
  /** Optional callback to create a new project */
  onCreate?: () => void;
  /** Whether a project switch is in progress */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

export const ProjectSwitcher = ({
  projects,
  currentProject,
  onSelect,
  onCreate,
  isLoading = false,
  className,
}: ProjectSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setError(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setError(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleSelect = (projectId: string) => {
    if (isLoading || projectId === currentProject.id) return;

    setError(null);
    try {
      onSelect(projectId);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch project:', err);
      setError('Failed to switch project');
    }
  };

  const handleCreate = () => {
    setIsOpen(false);
    onCreate?.();
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="gap-1.5"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Avatar
          src={currentProject.avatarUrl}
          fallback={
            currentProject.avatarFallback ?? (
              <FolderKanban className="h-4 w-4" />
            )
          }
          size="sm"
        />
        <span className="max-w-32 truncate font-medium">
          {currentProject.name}
        </span>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1',
            'w-56 rounded-md border border-border bg-background shadow-lg',
            'animate-fade-in-fast'
          )}
          role="listbox"
          aria-label="Select project"
        >
          {error && (
            <div className="mx-1 mt-1 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="px-1 py-1 max-h-64 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={project.id === currentProject.id}
                onClick={() => handleSelect(project.id)}
                disabled={isLoading}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                  'transition-colors hover:bg-muted',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                <Avatar
                  src={project.avatarUrl}
                  fallback={
                    project.avatarFallback ?? (
                      <FolderKanban className="h-4 w-4" />
                    )
                  }
                  size="sm"
                />
                <span className="flex-1 truncate">{project.name}</span>
                {project.id === currentProject.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          {onCreate && (
            <div className="px-1 py-1 border-t border-border">
              <button
                type="button"
                onClick={handleCreate}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                  'transition-colors hover:bg-muted'
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Create project</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ProjectSwitcher.displayName = 'ProjectSwitcher';
