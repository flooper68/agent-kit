import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
]);

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export type TaskStatusZod = z.infer<typeof TaskStatusSchema>;
export type TaskPriorityZod = z.infer<typeof TaskPrioritySchema>;
