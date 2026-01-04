import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  TaskDetailDialog,
  type TaskData,
  type TaskEvent,
  type TaskArtifact,
} from './TaskDetailDialog';
import { Button } from '../Button';

const meta: Meta<typeof TaskDetailDialog> = {
  title: 'Planning/TaskDetailDialog',
  component: TaskDetailDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dialog for viewing, editing, and creating tasks with full details.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskDetailDialog>;

const sampleEvents: TaskEvent[] = [
  {
    type: 'created',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
  },
  {
    type: 'status_changed',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
    details: { from: 'todo', to: 'in_progress' },
  },
  {
    type: 'priority_changed',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-2',
    details: { from: 'medium', to: 'high' },
  },
  {
    type: 'artifact_attached',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
    details: { artifactId: 'artifact-1' },
  },
];

const sampleArtifacts: TaskArtifact[] = [
  { id: '1', title: 'API Design Document', type: 'markdown' },
  { id: '2', title: 'Database Schema Diagram', type: 'image' },
  { id: '3', title: 'Implementation Notes', type: 'text' },
];

const sampleTask: TaskData = {
  id: 'task-1',
  title: 'Implement user authentication',
  description:
    'Add OAuth2 login with Google and GitHub providers.\n\nRequirements:\n- Support social login\n- Handle token refresh\n- Secure session management',
  status: 'in_progress',
  priority: 'high',
  artifacts: sampleArtifacts,
  events: sampleEvents,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
};

// Interactive wrapper
function DialogWrapper({
  task,
  mode,
  ...props
}: Partial<React.ComponentProps<typeof TaskDetailDialog>>) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <TaskDetailDialog
        open={open}
        onOpenChange={setOpen}
        task={task}
        mode={mode}
        onSave={(data) => {
          console.log('Save:', data);
          setOpen(false);
        }}
        onDelete={(id) => {
          console.log('Delete:', id);
          setOpen(false);
        }}
        {...props}
      />
    </div>
  );
}

export const ViewMode: Story = {
  render: () => <DialogWrapper task={sampleTask} mode="view" />,
  parameters: {
    docs: {
      description: {
        story: 'Read-only view of task details with all metadata.',
      },
    },
  },
};

export const EditMode: Story = {
  render: () => <DialogWrapper task={sampleTask} mode="edit" />,
  parameters: {
    docs: {
      description: {
        story: 'Editable form fields for updating task details.',
      },
    },
  },
};

export const NewTask: Story = {
  render: () => <DialogWrapper mode="create" />,
  parameters: {
    docs: {
      description: {
        story: 'Creating a new task with empty fields.',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        description: `# Implementation Details

This is a comprehensive task that involves multiple components.

## Steps
1. Set up OAuth configuration
2. Create login endpoints
3. Implement token management
4. Add session middleware
5. Create protected routes

## Notes
- Consider rate limiting
- Add proper error handling
- Include comprehensive logging

The deadline is flexible but we should aim to complete this before the next sprint.`,
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task with a long, detailed description.',
      },
    },
  },
};

export const WithArtifacts: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        artifacts: sampleArtifacts,
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows attached artifacts list.',
      },
    },
  },
};

export const WithEvents: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        events: [
          ...sampleEvents,
          {
            type: 'status_changed',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            userId: 'user-1',
            details: { from: 'in_progress', to: 'review' },
          },
          {
            type: 'updated',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            userId: 'user-2',
          },
        ],
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows event history timeline.',
      },
    },
  },
};

export const Saving: Story = {
  render: () => <DialogWrapper task={sampleTask} mode="edit" isSaving={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Save button in loading state.',
      },
    },
  },
};

export const WithValidationErrors: Story = {
  render: () => (
    <DialogWrapper
      task={{ ...sampleTask, title: '' }}
      mode="edit"
      errors={{
        title: 'Title is required',
        description: 'Description must be at least 10 characters',
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form with validation errors shown.',
      },
    },
  },
};

function ConfirmDeleteWrapper() {
  const [open, setOpen] = useState(true);

  // This story demonstrates the delete confirmation flow
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <TaskDetailDialog
        open={open}
        onOpenChange={setOpen}
        task={sampleTask}
        mode="edit"
        onSave={(data) => console.log('Save:', data)}
        onDelete={(id) => {
          console.log('Delete:', id);
          setOpen(false);
        }}
      />
      <p className="text-xs text-muted-foreground mt-4">
        Click the Delete button to see the confirmation dialog
      </p>
    </div>
  );
}

export const ConfirmDelete: Story = {
  render: () => <ConfirmDeleteWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Delete confirmation state (click Delete button to see).',
      },
    },
  },
};

export const LargeContent: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        description: Array(20)
          .fill(
            'This is a paragraph of text that makes the content very long. It should demonstrate scrolling behavior within the dialog.'
          )
          .join('\n\n'),
        artifacts: Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          title: `Artifact ${i + 1}: ${['Design Document', 'Implementation Notes', 'Test Plan', 'API Schema', 'Database Diagram'][i % 5]}`,
          type: ['markdown', 'text', 'json', 'image', 'pdf'][i % 5],
        })),
        events: Array.from({ length: 15 }, (_, i) => ({
          type: (
            [
              'created',
              'status_changed',
              'priority_changed',
              'updated',
              'artifact_attached',
            ] as const
          )[i % 5],
          timestamp: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000
          ).toISOString(),
          userId: `user-${(i % 3) + 1}`,
          details:
            i % 2 === 0 ? { from: 'todo', to: 'in_progress' } : undefined,
        })),
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Very long description, many artifacts and events.',
      },
    },
  },
};

export const MinimalTask: Story = {
  render: () => (
    <DialogWrapper
      task={{
        id: 'task-2',
        title: 'Simple task',
        status: 'todo',
        priority: 'low',
        createdAt: new Date(),
        updatedAt: new Date(),
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task with minimal data (just title, status, priority).',
      },
    },
  },
};

export const CompletedTask: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        status: 'done',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task marked as done with completion date.',
      },
    },
  },
};

export const UrgentPriority: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        priority: 'urgent',
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Urgent priority task.',
      },
    },
  },
};

export const CollapsibleHistory: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        events: [
          ...sampleEvents,
          {
            type: 'status_changed',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            userId: 'user-1',
            details: { from: 'in_progress', to: 'review' },
          },
          {
            type: 'updated',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            userId: 'user-2',
          },
          {
            type: 'status_changed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            userId: 'user-1',
            details: { from: 'review', to: 'done' },
          },
        ],
      }}
      mode="view"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'History section is collapsible. Click on "History" to expand/collapse the event timeline.',
      },
    },
  },
};

export const CollapsibleHistoryEditMode: Story = {
  render: () => (
    <DialogWrapper
      task={{
        ...sampleTask,
        events: sampleEvents,
      }}
      mode="edit"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'History section is also collapsible in edit mode. Click on "History" to expand/collapse.',
      },
    },
  },
};
