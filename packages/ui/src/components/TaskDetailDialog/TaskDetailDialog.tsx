import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { ToggleGroup } from '../ToggleGroup';
import { Tooltip, TooltipProvider } from '../Tooltip';
import { StatusBadge, type TaskStatus } from '../StatusBadge';
import { PriorityBadge, type Priority } from '../PriorityBadge';
import {
  X,
  Trash2,
  Paperclip,
  History,
  Pencil,
  Check,
  Loader2,
  Plus,
  Circle,
  Clock,
  Eye,
  CheckCircle,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TaskEvent {
  type:
    | 'created'
    | 'status_changed'
    | 'priority_changed'
    | 'updated'
    | 'artifact_attached'
    | 'artifact_detached';
  timestamp: string;
  userId: string;
  details?: {
    from?: string;
    to?: string;
    artifactId?: string;
  };
}

export interface TaskArtifact {
  id: string;
  title: string;
  type?: string;
}

export interface TaskData {
  id?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  completedAt?: Date | null;
  artifacts?: TaskArtifact[];
  events?: TaskEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskData | null;
  mode?: 'view' | 'edit' | 'create';
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
  onSave?: (data: Partial<TaskData>) => void | Promise<void>;
  onDelete?: (taskId: string) => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  errors?: Partial<Record<keyof TaskData, string>>;
  className?: string;
  /** Enable autosave with debounce */
  autoSave?: boolean;
  /** Debounce delay in ms (default: 1000) */
  autoSaveDelay?: number;
  /** External autosave status for controlled mode */
  autoSaveStatus?: AutoSaveStatus;
  /** Called when clicking on an artifact to view details */
  onArtifactClick?: (artifactId: string) => void;
  /** Called to detach an artifact from the task */
  onDetachArtifact?: (artifactId: string) => void;
  /** Called to open artifact picker to attach more */
  onAttachArtifact?: () => void;
}

function formatEventType(type: TaskEvent['type']): string {
  switch (type) {
    case 'created':
      return 'Task created';
    case 'status_changed':
      return 'Status changed';
    case 'priority_changed':
      return 'Priority changed';
    case 'updated':
      return 'Task updated';
    case 'artifact_attached':
      return 'Artifact attached';
    case 'artifact_detached':
      return 'Artifact detached';
    default:
      return 'Unknown event';
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  mode = 'view',
  onModeChange,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  errors = {},
  className,
  autoSave = false,
  autoSaveDelay = 1000,
  autoSaveStatus: externalAutoSaveStatus,
  onArtifactClick,
  onDetachArtifact,
  onAttachArtifact,
}: TaskDetailDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [formData, setFormData] = useState<Partial<TaskData>>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
  });
  const [internalAutoSaveStatus, setInternalAutoSaveStatus] =
    useState<AutoSaveStatus>('idle');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const idleResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFormDataRef = useRef<Partial<TaskData>>({});
  const hasChangedRef = useRef(false);
  const pendingFormDataRef = useRef<Partial<TaskData> | null>(null);
  const latestFormDataRef = useRef<Partial<TaskData>>(formData);

  const autoSaveStatus = externalAutoSaveStatus ?? internalAutoSaveStatus;

  // Flush pending changes and call onOpenChange
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      // If closing, flush any pending changes first
      if (
        !newOpen &&
        autoSave &&
        onSave &&
        pendingFormDataRef.current &&
        mode !== 'create'
      ) {
        // Clear debounce timer since we're saving immediately
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        onSave(pendingFormDataRef.current);
        pendingFormDataRef.current = null;
      }
      onOpenChange(newOpen);
    },
    [autoSave, mode, onOpenChange, onSave]
  );

  // Reset formData when task ID or mode changes (not on every task object change)
  // Using task object changes would reset pending changes when cache invalidates after save
  const taskId = task?.id;
  useEffect(() => {
    const initial = {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
    };
    setFormData(initial);
    initialFormDataRef.current = initial;
    latestFormDataRef.current = initial;
    hasChangedRef.current = false;
    pendingFormDataRef.current = null;
    setShowDeleteConfirm(false);
    setInternalAutoSaveStatus('idle');
    // Intentionally omitting `task` from deps - we only want to reset form when
    // task ID or mode changes, not when the task object reference changes (e.g.,
    // after cache invalidation following a save). Including `task` would cause
    // the form to reset and lose pending autosave changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, mode]);

  // Cleanup timers on unmount or dialog close
  useEffect(() => {
    if (!open) {
      // Clear all timers when dialog closes
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (savingIndicatorTimerRef.current) {
        clearTimeout(savingIndicatorTimerRef.current);
        savingIndicatorTimerRef.current = null;
      }
      if (idleResetTimerRef.current) {
        clearTimeout(idleResetTimerRef.current);
        idleResetTimerRef.current = null;
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savingIndicatorTimerRef.current) {
        clearTimeout(savingIndicatorTimerRef.current);
      }
      if (idleResetTimerRef.current) {
        clearTimeout(idleResetTimerRef.current);
      }
    };
  }, [open]);

  // Autosave logic
  const triggerAutoSave = useCallback(
    (data: Partial<TaskData>) => {
      if (!autoSave || mode === 'create' || !onSave) return;

      // Clear existing timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savingIndicatorTimerRef.current) {
        clearTimeout(savingIndicatorTimerRef.current);
      }

      // Check if there are actual changes
      const hasChanges =
        data.title !== initialFormDataRef.current.title ||
        data.description !== initialFormDataRef.current.description ||
        data.status !== initialFormDataRef.current.status ||
        data.priority !== initialFormDataRef.current.priority;

      if (!hasChanges) {
        setInternalAutoSaveStatus('idle');
        pendingFormDataRef.current = null;
        return;
      }

      hasChangedRef.current = true;
      pendingFormDataRef.current = data;

      // Set debounce timer
      debounceTimerRef.current = setTimeout(async () => {
        // Use the most current pending data, not stale closure
        const dataToSave = pendingFormDataRef.current ?? data;

        // Delay showing "saving" indicator to avoid blinking on fast saves
        savingIndicatorTimerRef.current = setTimeout(() => {
          setInternalAutoSaveStatus('saving');
        }, 300);

        try {
          await onSave(dataToSave);
          // Clear the saving indicator timer if save completed fast
          if (savingIndicatorTimerRef.current) {
            clearTimeout(savingIndicatorTimerRef.current);
            savingIndicatorTimerRef.current = null;
          }
          setInternalAutoSaveStatus('saved');
          initialFormDataRef.current = dataToSave;
          pendingFormDataRef.current = null;
          // Clear any existing idle reset timer
          if (idleResetTimerRef.current) {
            clearTimeout(idleResetTimerRef.current);
          }
          // Reset to idle after showing saved status (longer duration)
          idleResetTimerRef.current = setTimeout(() => {
            idleResetTimerRef.current = null;
            setInternalAutoSaveStatus('idle');
          }, 4000);
        } catch {
          if (savingIndicatorTimerRef.current) {
            clearTimeout(savingIndicatorTimerRef.current);
            savingIndicatorTimerRef.current = null;
          }
          setInternalAutoSaveStatus('error');
        }
      }, autoSaveDelay);
    },
    [autoSave, autoSaveDelay, mode, onSave]
  );

  const isEditable = mode === 'edit' || mode === 'create';
  const isNewTask = mode === 'create';
  const dialogTitle = showDeleteConfirm
    ? 'Delete Task'
    : isNewTask
      ? 'Create Task'
      : isEditable
        ? 'Edit Task'
        : task?.title || 'Task Details';

  const handleSave = () => {
    onSave?.(formData);
  };

  const handleDelete = () => {
    if (task?.id) {
      onDelete?.(task.id);
    }
  };

  const handleInputChange = (field: keyof TaskData, value: unknown) => {
    // Use ref to get latest state, avoiding stale closure issue with rapid changes
    const newFormData = { ...latestFormDataRef.current, [field]: value };
    latestFormDataRef.current = newFormData;
    setFormData(newFormData);

    // Trigger autosave if enabled
    if (autoSave) {
      triggerAutoSave(newFormData);
    }
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Header with title and metadata */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{task?.title}</h2>

        {task?.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        )}
      </div>

      {/* Status and Priority */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <div>
            <StatusBadge status={task?.status ?? 'todo'} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Priority</span>
          <div>
            <PriorityBadge priority={task?.priority ?? 'medium'} />
          </div>
        </div>
      </div>

      {/* Artifacts */}
      {task?.artifacts && task.artifacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Paperclip className="h-4 w-4" />
            Attachments ({task.artifacts.length})
          </div>
          <div className="space-y-1">
            {task.artifacts.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => onArtifactClick?.(artifact.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm bg-muted/50 rounded-md text-left',
                  onArtifactClick &&
                    'hover:bg-muted cursor-pointer transition-colors'
                )}
              >
                <span className="truncate flex-1">{artifact.title}</span>
                {artifact.type && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({artifact.type})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event History - Collapsible */}
      {task?.events && task.events.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History ({task.events.length})
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isHistoryExpanded && 'rotate-180'
              )}
            />
          </button>
          {isHistoryExpanded && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {task.events.map((event, index) => (
                <div
                  key={`${event.type}-${event.timestamp}-${index}`}
                  className="flex items-start gap-3 text-xs"
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">
                      {formatEventType(event.type)}
                    </p>
                    {event.details?.from && event.details?.to && (
                      <p className="text-muted-foreground">
                        {event.details.from} → {event.details.to}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      {(task?.createdAt || task?.updatedAt) && (
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
          {task.createdAt && <div>Created: {formatDate(task.createdAt)}</div>}
          {task.updatedAt && <div>Updated: {formatDate(task.updatedAt)}</div>}
        </div>
      )}
    </div>
  );

  const renderEditMode = () => (
    <div className="space-y-4">
      {/* Title */}
      <Input
        id="title"
        label="Title"
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        placeholder="Enter task title"
        error={errors.title}
      />

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <Textarea
          id="description"
          value={formData.description ?? ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description"
          autoResize
          rows={6}
          className="min-h-[120px]"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <TooltipProvider>
        <div className="space-y-4">
          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Status
            </label>
            <ToggleGroup
              value={formData.status ?? 'todo'}
              onValueChange={(value) => handleInputChange('status', value)}
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

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Priority
            </label>
            <ToggleGroup
              value={formData.priority ?? 'medium'}
              onValueChange={(value) => handleInputChange('priority', value)}
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

      {/* Artifacts */}
      {!isNewTask && (
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Paperclip className="h-4 w-4" />
              Attachments{' '}
              {task?.artifacts &&
                task.artifacts.length > 0 &&
                `(${task.artifacts.length})`}
            </div>
            {onAttachArtifact && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAttachArtifact}
              >
                <Plus className="h-3 w-3 mr-1" />
                Attach
              </Button>
            )}
          </div>
          {task?.artifacts && task.artifacts.length > 0 ? (
            <div className="border border-border rounded-md divide-y divide-border">
              {task.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm group transition-colors',
                    onArtifactClick && 'hover:bg-muted/50 cursor-pointer'
                  )}
                  onClick={() => onArtifactClick?.(artifact.id)}
                  role={onArtifactClick ? 'button' : undefined}
                  tabIndex={onArtifactClick ? 0 : undefined}
                >
                  <span className="flex-1 min-w-0 text-left truncate">
                    {artifact.title}
                  </span>
                  {artifact.type && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {artifact.type}
                    </span>
                  )}
                  {onDetachArtifact && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDetachArtifact(artifact.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attachments</p>
          )}
        </div>
      )}

      {/* History - Collapsible */}
      {!isNewTask && task?.events && task.events.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History ({task.events.length})
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isHistoryExpanded && 'rotate-180'
              )}
            />
          </button>
          {isHistoryExpanded && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {task.events.map((event, index) => (
                <div
                  key={`${event.type}-${event.timestamp}-${index}`}
                  className="flex items-start gap-3 text-xs"
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">
                      {formatEventType(event.type)}
                    </p>
                    {event.details?.from && event.details?.to && (
                      <p className="text-muted-foreground">
                        {event.details.from} → {event.details.to}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDeleteConfirm = () => (
    <div className="space-y-4">
      <p className="text-sm">
        Are you sure you want to delete &quot;{task?.title}&quot;? This action
        cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          isLoading={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content
        size={showDeleteConfirm ? 'sm' : 'lg'}
        className={cn(
          !showDeleteConfirm && 'h-[70vh] flex flex-col overflow-hidden',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <div className="flex items-center gap-2 -mr-2 -mt-2">
            {/* Autosave status indicator */}
            {autoSave && isEditable && !isNewTask && !showDeleteConfirm && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-destructive">Failed to save</span>
                )}
              </div>
            )}
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
        </div>

        {showDeleteConfirm ? (
          renderDeleteConfirm()
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-4">
              {isEditable ? renderEditMode() : renderViewMode()}
            </div>

            <Dialog.Footer className="mt-auto pt-4 border-t border-border">
              {!isNewTask && task?.id && onDelete && isEditable && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}

              <Dialog.Close asChild>
                <Button variant="outline">
                  {isEditable && autoSave && !isNewTask
                    ? 'Done'
                    : isEditable
                      ? 'Cancel'
                      : 'Close'}
                </Button>
              </Dialog.Close>
              {!isEditable && onModeChange && (
                <Button variant="primary" onClick={() => onModeChange('edit')}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {isEditable && (!autoSave || isNewTask) && (
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  {isNewTask ? 'Create Task' : 'Save Changes'}
                </Button>
              )}
            </Dialog.Footer>
          </>
        )}
      </Dialog.Content>
    </Dialog>
  );
}

TaskDetailDialog.displayName = 'TaskDetailDialog';
