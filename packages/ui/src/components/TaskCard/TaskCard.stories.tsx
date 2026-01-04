import type { Meta, StoryObj } from '@storybook/react';
import { TaskCard } from './TaskCard';

const meta: Meta<typeof TaskCard> = {
  title: 'Planning/TaskCard',
  component: TaskCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A compact card for displaying task information in a Kanban board.',
      },
    },
  },
  argTypes: {
    priority: {
      control: 'select',
      options: ['low', 'medium', 'high', 'urgent'],
    },
    isDragging: {
      control: 'boolean',
    },
    showDragHandle: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

// Helper to create dates relative to today
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const Default: Story = {
  args: {
    id: '1',
    title: 'Implement user authentication',
    priority: 'medium',
  },
};

export const WithDescription: Story = {
  args: {
    id: '2',
    title: 'Set up CI/CD pipeline',
    description:
      'Configure GitHub Actions for automated testing and deployment.',
    priority: 'high',
  },
};

export const AllPriorities: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <TaskCard id="1" title="Low priority task" priority="low" />
      <TaskCard id="2" title="Medium priority task" priority="medium" />
      <TaskCard id="3" title="High priority task" priority="high" />
      <TaskCard id="4" title="Urgent priority task" priority="urgent" />
    </div>
  ),
};

export const WithDueDate: Story = {
  args: {
    id: '3',
    title: 'Review pull request',
    priority: 'medium',
    dueDate: daysFromNow(3),
  },
};

export const Overdue: Story = {
  args: {
    id: '4',
    title: 'Submit quarterly report',
    priority: 'urgent',
    dueDate: daysFromNow(-2),
  },
};

export const DueToday: Story = {
  args: {
    id: '5',
    title: 'Deploy to staging',
    priority: 'high',
    dueDate: daysFromNow(0),
  },
};

export const DueSoon: Story = {
  args: {
    id: '6',
    title: 'Update documentation',
    priority: 'medium',
    dueDate: daysFromNow(2),
  },
};

export const WithArtifacts: Story = {
  args: {
    id: '7',
    title: 'Design review meeting',
    priority: 'medium',
    artifactCount: 3,
  },
};

export const ManyArtifacts: Story = {
  args: {
    id: '8',
    title: 'Research competitor products',
    priority: 'low',
    artifactCount: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "5+" when there are more than 5 artifacts.',
      },
    },
  },
};

export const Dragging: Story = {
  args: {
    id: '9',
    title: 'Task being dragged',
    priority: 'medium',
    isDragging: true,
  },
};

export const WithDragHandle: Story = {
  args: {
    id: '10',
    title: 'Hover to see drag handle',
    description: 'The drag handle appears on hover.',
    priority: 'medium',
    showDragHandle: true,
  },
};

export const LongTitle: Story = {
  args: {
    id: '11',
    title:
      'This is a very long task title that should wrap to multiple lines and eventually be truncated with an ellipsis',
    priority: 'medium',
  },
};

export const Minimal: Story = {
  args: {
    id: '12',
    title: 'Simple task',
    priority: 'low',
  },
};

export const FullyLoaded: Story = {
  args: {
    id: '13',
    title: 'Complete feature implementation',
    description: 'Implement all remaining features for the v2.0 release.',
    priority: 'urgent',
    dueDate: daysFromNow(1),
    artifactCount: 4,
    onClick: () => console.log('Task clicked!'),
    showDragHandle: true,
  },
};

export const KanbanColumn: Story = {
  render: () => (
    <div className="w-72 rounded-lg bg-muted/30 p-3">
      <h3 className="mb-3 font-medium text-sm">In Progress</h3>
      <div className="space-y-2">
        <TaskCard
          id="1"
          title="Implement authentication"
          priority="high"
          dueDate={daysFromNow(2)}
          onClick={() => {}}
        />
        <TaskCard
          id="2"
          title="Set up database migrations"
          description="Configure Drizzle ORM"
          priority="medium"
          onClick={() => {}}
        />
        <TaskCard
          id="3"
          title="Write unit tests"
          priority="low"
          artifactCount={2}
          onClick={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of TaskCards in a Kanban column.',
      },
    },
  },
};
