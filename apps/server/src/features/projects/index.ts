export { ProjectsFeature } from './projects-feature';

// Export types from commands
export type { CreateProjectInput, CreateProjectResult } from './commands';
export type { UpdateProjectInput, UpdateProjectResult } from './commands';
export type { DeleteProjectInput, DeleteProjectResult } from './commands';

// Export types from queries
export type {
  GetProjectByIdInput,
  GetProjectByIdResult,
  ProjectWithTasks,
  TaskSummary,
} from './queries';
export type {
  ListProjectsInput,
  ListProjectsResult,
  ProjectListItem,
  TaskCounts,
} from './queries';
export type { SearchProjectsInput, SearchProjectsResult } from './queries';
export type { GetProjectStatsInput, GetProjectStatsResult } from './queries';
