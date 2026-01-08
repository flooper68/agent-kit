export { TasksFeature } from './tasks-feature';

// Export types from commands
export type { CreateTaskInput, CreateTaskResult } from './commands';
export type { UpdateTaskInput, UpdateTaskResult } from './commands';
export type { DeleteTaskInput, DeleteTaskResult } from './commands';
export type { MoveTaskInput, MoveTaskResult } from './commands';
export type { AttachArtifactInput, AttachArtifactResult } from './commands';
export type { DetachArtifactInput, DetachArtifactResult } from './commands';

// Export types from queries
export type {
  GetTaskByIdInput,
  GetTaskByIdResult,
  TaskWithDetails,
  ArtifactSummary,
} from './queries';
export type {
  ListTasksInput,
  TaskListItem,
  ListTasksByProjectResult,
} from './queries';
export type {
  GetTasksByStatusInput,
  TasksByStatus,
  GetTasksByStatusResult,
} from './queries';
export type {
  SearchTasksInput,
  SearchTaskResult,
  SearchTasksResult,
} from './queries';
export type { GetTaskStatsInput, GetTaskStatsResult } from './queries';

// Re-export schema types
export type { TaskStatus, TaskPriority, Task } from './types';
export { TaskStatusSchema, TaskPrioritySchema } from './schemas';
