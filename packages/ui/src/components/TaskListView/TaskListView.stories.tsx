import type { Meta, StoryObj } from '@storybook/react';
import { TaskListView, type TaskListItem } from './TaskListView';

const meta: Meta<typeof TaskListView> = {
  title: 'Planning/TaskListView',
  component: TaskListView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A table/list view for tasks as an alternative to the Kanban board.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskListView>;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const sampleTasks: TaskListItem[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add OAuth2 login with Google and GitHub',
    status: 'in_progress',
    priority: 'high',
    dueDate: daysFromNow(2),
    artifactCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Set up CI/CD pipeline',
    status: 'todo',
    priority: 'medium',
    dueDate: daysFromNow(5),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Write unit tests',
    description: 'Achieve 80% code coverage',
    status: 'review',
    priority: 'medium',
    dueDate: daysFromNow(-1),
    artifactCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Design review meeting',
    status: 'done',
    priority: 'low',
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: 'Fix critical bug in checkout',
    description: 'Users unable to complete purchases',
    status: 'todo',
    priority: 'urgent',
    dueDate: daysFromNow(0),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const Default: Story = {
  args: {
    tasks: sampleTasks,
    onTaskClick: (id) => console.log('Task clicked:', id),
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
  },
};

export const CustomEmptyMessage: Story = {
  args: {
    tasks: [],
    emptyMessage: 'No tasks match your filters',
  },
};

export const ManyTasks: Story = {
  args: {
    tasks: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      title: `Task ${i + 1}`,
      description: i % 3 === 0 ? 'Task with description' : undefined,
      status: (['todo', 'in_progress', 'review', 'done'] as const)[i % 4],
      priority: (['low', 'medium', 'high', 'urgent'] as const)[i % 4],
      dueDate: i % 2 === 0 ? daysFromNow(i - 5) : undefined,
      artifactCount: i % 3 === 0 ? i % 5 : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    onTaskClick: (id) => console.log('Task clicked:', id),
  },
};

export const SortedByPriority: Story = {
  args: {
    tasks: [...sampleTasks].sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    onTaskClick: (id) => console.log('Task clicked:', id),
  },
};

export const SortedByDueDate: Story = {
  args: {
    tasks: [...sampleTasks]
      .filter((t) => t.dueDate)
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime()),
    onTaskClick: (id) => console.log('Task clicked:', id),
  },
};

export const WithClickableRows: Story = {
  args: {
    tasks: sampleTasks,
    onTaskClick: (id) => alert(`Clicked task: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Rows show hover state when onTaskClick is provided.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 px-4 py-2 bg-muted/50 border-b border-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 bg-muted animate-pulse rounded" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 px-4 py-3"
          >
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
            <div className="h-5 w-14 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  ),
};
