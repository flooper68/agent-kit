-- Add 'backlog' to the task_status enum
ALTER TYPE "public"."task_status" ADD VALUE 'backlog' BEFORE 'todo';
