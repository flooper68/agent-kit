import type { TaskStatus, TaskPriority, TaskEvent } from '../../db/schema';

export interface CreateTaskInput {
  projectId: string;
  userId: string;
  orgId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  id: string;
  userId: string;
  orgId: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface MoveTaskInput {
  id: string;
  userId: string;
  orgId: string;
  status: TaskStatus;
  position: number;
}

export interface ListTasksInput {
  projectId: string;
  userId: string;
  orgId: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  hasArtifacts?: boolean;
}

export interface TaskListItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  completedAt: Date | null;
  artifactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithDetails {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  completedAt: Date | null;
  events: TaskEvent[];
  artifacts: ArtifactSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtifactSummary {
  id: string;
  title: string;
  format: string;
  createdAt: Date;
}

export interface TasksByStatus {
  backlog: TaskListItem[];
  todo: TaskListItem[];
  in_progress: TaskListItem[];
  review: TaskListItem[];
  done: TaskListItem[];
}

export interface SearchTasksInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
}

export interface TaskStats {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  completedThisWeek: number;
}
