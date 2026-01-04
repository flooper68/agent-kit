import type { TaskStatus } from '../../db/schema';

export interface CreateProjectInput {
  userId: string;
  orgId: string;
  title: string;
  summary?: string;
}

export interface UpdateProjectInput {
  id: string;
  userId: string;
  orgId: string;
  title?: string;
  summary?: string | null;
}

export interface ListProjectsInput {
  userId: string;
  orgId: string;
  limit: number;
  cursor?: string;
  search?: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  summary: string | null;
  taskCounts: TaskCounts;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCounts {
  backlog: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  total: number;
}

export interface PaginatedProjects {
  items: ProjectListItem[];
  nextCursor: string | undefined;
}

export interface ProjectWithTasks {
  id: string;
  title: string;
  summary: string | null;
  tasksByStatus: Record<TaskStatus, TaskSummary[]>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSummary {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  artifactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchProjectsInput {
  userId: string;
  orgId: string;
  query: string;
  limit: number;
}

export interface ProjectStats {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
}
