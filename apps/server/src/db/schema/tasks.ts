import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

// Task status enum
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
]);

// Task priority enum
export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// TaskEvent type for state change history stored in JSONB
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
    changes?: Record<string, unknown>;
  };
}

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Parent project
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    // Ownership
    userId: varchar('user_id', { length: 255 }).notNull(),
    orgId: varchar('org_id', { length: 255 }).notNull(),

    // Core content
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Status and priority
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),

    // Position for ordering within a column
    position: integer('position').notNull().default(0),

    // Completion timestamp
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Event history for state changes
    events: jsonb('events').$type<TaskEvent[]>().default([]),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('tasks_project_id_idx').on(table.projectId),
    index('tasks_org_status_idx').on(table.orgId, table.status),
    index('tasks_project_status_position_idx').on(
      table.projectId,
      table.status,
      table.position
    ),
  ]
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
