import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { KanbanBoard, type KanbanTask, type TaskStatus } from './KanbanBoard';

const meta: Meta<typeof KanbanBoard> = {
  title: 'Planning/KanbanBoard',
  component: KanbanBoard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A full Kanban board with drag-and-drop functionality.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const sampleTasks: KanbanTask[] = [
  {
    id: '1',
    title: 'Set up project structure',
    priority: 'high',
    status: 'done',
  },
  {
    id: '2',
    title: 'Create database schema',
    priority: 'high',
    status: 'done',
  },
  {
    id: '3',
    title: 'Implement authentication',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: daysFromNow(2),
  },
  {
    id: '4',
    title: 'Design API endpoints',
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: '5',
    title: 'Write unit tests',
    priority: 'medium',
    status: 'review',
    artifactCount: 2,
  },
  {
    id: '6',
    title: 'Create UI components',
    priority: 'medium',
    status: 'todo',
    dueDate: daysFromNow(5),
  },
  { id: '7', title: 'Set up CI/CD pipeline', priority: 'low', status: 'todo' },
  {
    id: '8',
    title: 'Documentation',
    priority: 'low',
    status: 'todo',
    description: 'Write API documentation and usage guides',
  },
];

export const Default: Story = {
  args: {
    tasks: sampleTasks,
    onTaskMove: (taskId, newStatus, newPosition) => {
      console.log(
        `Task ${taskId} moved to ${newStatus} at position ${newPosition}`
      );
    },
    onTaskClick: (taskId) => {
      console.log(`Task ${taskId} clicked`);
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    tasks: [],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const FullTodo: Story = {
  args: {
    tasks: [
      { id: '1', title: 'Task 1', priority: 'high', status: 'todo' },
      { id: '2', title: 'Task 2', priority: 'medium', status: 'todo' },
      { id: '3', title: 'Task 3', priority: 'low', status: 'todo' },
      { id: '4', title: 'Task 4', priority: 'urgent', status: 'todo' },
      { id: '5', title: 'Task 5', priority: 'medium', status: 'todo' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const FullDone: Story = {
  args: {
    tasks: [
      { id: '1', title: 'Completed task 1', priority: 'high', status: 'done' },
      {
        id: '2',
        title: 'Completed task 2',
        priority: 'medium',
        status: 'done',
      },
      { id: '3', title: 'Completed task 3', priority: 'low', status: 'done' },
      {
        id: '4',
        title: 'Completed task 4',
        priority: 'urgent',
        status: 'done',
      },
      {
        id: '5',
        title: 'Completed task 5',
        priority: 'medium',
        status: 'done',
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

// Interactive story with state management
function InteractiveKanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>(sampleTasks);

  const handleTaskMove = (
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number
  ) => {
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const newTasks = [...prev];
      const [task] = newTasks.splice(taskIndex, 1);

      // Update the task's status
      const updatedTask = { ...task, status: newStatus };

      // Find the correct position to insert
      const insertIndex = newTasks.findIndex((t) => t.status === newStatus);

      if (insertIndex === -1) {
        newTasks.push(updatedTask);
      } else {
        newTasks.splice(insertIndex + newPosition, 0, updatedTask);
      }

      return newTasks;
    });
  };

  return (
    <KanbanBoard
      tasks={tasks}
      onTaskMove={handleTaskMove}
      onTaskClick={(id) => alert(`Clicked task: ${id}`)}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveKanbanBoard />,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive board with working drag-and-drop. Try moving tasks between columns!',
      },
    },
  },
};

export const SingleColumn: Story = {
  args: {
    tasks: [
      { id: '1', title: 'Task 1', priority: 'high', status: 'in_progress' },
      { id: '2', title: 'Task 2', priority: 'medium', status: 'in_progress' },
      { id: '3', title: 'Task 3', priority: 'low', status: 'in_progress' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const MixedPriorities: Story = {
  args: {
    tasks: [
      { id: '1', title: 'Urgent task', priority: 'urgent', status: 'todo' },
      {
        id: '2',
        title: 'High priority',
        priority: 'high',
        status: 'in_progress',
      },
      {
        id: '3',
        title: 'Medium priority',
        priority: 'medium',
        status: 'review',
      },
      { id: '4', title: 'Low priority', priority: 'low', status: 'done' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const WithOverdueTasks: Story = {
  args: {
    tasks: [
      {
        id: '1',
        title: 'Overdue task',
        priority: 'urgent',
        status: 'todo',
        dueDate: daysFromNow(-3),
      },
      {
        id: '2',
        title: 'Due today',
        priority: 'high',
        status: 'in_progress',
        dueDate: daysFromNow(0),
      },
      {
        id: '3',
        title: 'Due tomorrow',
        priority: 'medium',
        status: 'review',
        dueDate: daysFromNow(1),
      },
      {
        id: '4',
        title: 'Due next week',
        priority: 'low',
        status: 'todo',
        dueDate: daysFromNow(7),
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  render: () => (
    <div className="p-4">
      <div className="flex gap-4">
        {['Todo', 'In Progress', 'Review', 'Done'].map((title) => (
          <div key={title} className="w-72 flex-shrink-0">
            <div className="rounded-lg bg-muted/30 border-t-2 border-t-gray-400">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-6 bg-muted animate-pulse rounded-full" />
              </div>
              <div className="p-2 space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton state for the Kanban board.',
      },
    },
  },
};
