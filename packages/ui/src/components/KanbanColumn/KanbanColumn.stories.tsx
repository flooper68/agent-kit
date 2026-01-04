import type { Meta, StoryObj } from '@storybook/react';
import { DndContext } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '../TaskCard';

const meta: Meta<typeof KanbanColumn> = {
  title: 'Planning/KanbanColumn',
  component: KanbanColumn,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A column in a Kanban board that can receive dragged items.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DndContext>
        <div className="w-72">
          <Story />
        </div>
      </DndContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanColumn>;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const Default: Story = {
  args: {
    id: 'in_progress',
    title: 'In Progress',
    count: 3,
    itemIds: ['1', '2', '3'],
    children: (
      <>
        <TaskCard id="1" title="Task 1" priority="high" />
        <TaskCard id="2" title="Task 2" priority="medium" />
        <TaskCard id="3" title="Task 3" priority="low" />
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    id: 'review',
    title: 'Review',
    count: 0,
    itemIds: [],
    children: null,
  },
};

export const ManyTasks: Story = {
  render: () => (
    <DndContext>
      <div className="w-72 h-[500px]">
        <KanbanColumn
          id="todo"
          title="Todo"
          count={10}
          itemIds={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <TaskCard
              key={i}
              id={String(i + 1)}
              title={`Task ${i + 1}`}
              priority={
                ['low', 'medium', 'high', 'urgent'][i % 4] as
                  | 'low'
                  | 'medium'
                  | 'high'
                  | 'urgent'
              }
            />
          ))}
        </KanbanColumn>
      </div>
    </DndContext>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Column with many tasks, demonstrating scroll behavior.',
      },
    },
  },
};

export const TodoColumn: Story = {
  args: {
    id: 'todo',
    title: 'Todo',
    count: 2,
    itemIds: ['1', '2'],
    children: (
      <>
        <TaskCard id="1" title="Set up project structure" priority="high" />
        <TaskCard id="2" title="Create component library" priority="medium" />
      </>
    ),
  },
};

export const InProgressColumn: Story = {
  args: {
    id: 'in_progress',
    title: 'In Progress',
    count: 2,
    itemIds: ['1', '2'],
    children: (
      <>
        <TaskCard
          id="1"
          title="Implement authentication"
          priority="high"
          dueDate={daysFromNow(2)}
        />
        <TaskCard
          id="2"
          title="Design review"
          priority="medium"
          artifactCount={3}
        />
      </>
    ),
  },
};

export const ReviewColumn: Story = {
  args: {
    id: 'review',
    title: 'Review',
    count: 1,
    itemIds: ['1'],
    children: (
      <TaskCard id="1" title="Code review: API endpoints" priority="medium" />
    ),
  },
};

export const DoneColumn: Story = {
  args: {
    id: 'done',
    title: 'Done',
    count: 3,
    itemIds: ['1', '2', '3'],
    children: (
      <>
        <TaskCard id="1" title="Initial setup" priority="high" />
        <TaskCard id="2" title="Database schema" priority="medium" />
        <TaskCard id="3" title="Basic CRUD operations" priority="low" />
      </>
    ),
  },
};

export const AllColumns: Story = {
  render: () => (
    <DndContext>
      <div className="flex gap-4">
        <div className="w-72">
          <KanbanColumn id="todo" title="Todo" count={2} itemIds={['1', '2']}>
            <TaskCard id="1" title="Task 1" priority="medium" />
            <TaskCard id="2" title="Task 2" priority="low" />
          </KanbanColumn>
        </div>
        <div className="w-72">
          <KanbanColumn
            id="in_progress"
            title="In Progress"
            count={1}
            itemIds={['3']}
          >
            <TaskCard id="3" title="Task 3" priority="high" />
          </KanbanColumn>
        </div>
        <div className="w-72">
          <KanbanColumn id="review" title="Review" count={0} itemIds={[]}>
            {null}
          </KanbanColumn>
        </div>
        <div className="w-72">
          <KanbanColumn id="done" title="Done" count={2} itemIds={['4', '5']}>
            <TaskCard id="4" title="Task 4" priority="medium" />
            <TaskCard id="5" title="Task 5" priority="low" />
          </KanbanColumn>
        </div>
      </div>
    </DndContext>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All four columns displayed together.',
      },
    },
  },
};
