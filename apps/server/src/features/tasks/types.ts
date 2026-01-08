/**
 * Shared types for the tasks feature.
 * Input/result types for handlers are co-located with their handlers.
 */

// Re-export schema types that are commonly used
export type {
  TaskStatus,
  TaskPriority,
  TaskEvent,
  Task,
} from '../../db/schema';
