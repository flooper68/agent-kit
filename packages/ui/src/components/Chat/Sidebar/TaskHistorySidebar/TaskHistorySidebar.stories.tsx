import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TaskHistorySidebar } from './TaskHistorySidebar';
import { Button } from '../../../Button';
import type { TaskHistoryItem } from '../../../../types/chat';

const createTask = (
  id: string,
  title: string,
  daysAgo: number,
  preview?: string
): TaskHistoryItem => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    title,
    preview,
    createdAt: date,
    updatedAt: date,
  };
};

const sampleTasks: TaskHistoryItem[] = [
  createTask(
    '1',
    'Help with React hooks',
    0,
    'Can you explain useEffect cleanup functions?'
  ),
  createTask(
    '2',
    'TypeScript generics',
    1,
    'I need help understanding generic constraints'
  ),
  createTask(
    '3',
    'API design patterns',
    2,
    'What are best practices for REST API design?'
  ),
  createTask(
    '4',
    'Database optimization',
    5,
    'How can I improve my PostgreSQL query performance?'
  ),
  createTask(
    '5',
    'Testing strategies',
    8,
    'What testing approach should I use for a React app?'
  ),
];

const meta: Meta<typeof TaskHistorySidebar> = {
  title: 'Chat/TaskHistorySidebar',
  component: TaskHistorySidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof TaskHistorySidebar>;

// Interactive wrapper
const SidebarWrapper = ({
  tasks = sampleTasks,
  selectedTaskId,
}: {
  tasks?: TaskHistoryItem[];
  selectedTaskId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(selectedTaskId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Task History</Button>
      <TaskHistorySidebar
        open={open}
        onOpenChange={setOpen}
        tasks={tasks}
        selectedTaskId={selected}
        onTaskSelect={(id) => {
          setSelected(id);
          console.log('Selected:', id);
        }}
        onTaskDelete={(id) => console.log('Delete:', id)}
        onNewTask={() => console.log('New task')}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <SidebarWrapper />,
};

export const WithSelection: Story = {
  render: () => <SidebarWrapper selectedTaskId="2" />,
};

export const Empty: Story = {
  render: () => <SidebarWrapper tasks={[]} />,
};

export const ManyTasks: Story = {
  render: () => (
    <SidebarWrapper
      tasks={Array.from({ length: 20 }, (_, i) =>
        createTask(
          `task-${i + 1}`,
          `Task conversation ${i + 1}`,
          i,
          `This is a preview of task ${i + 1} with some sample content...`
        )
      )}
    />
  ),
};

export const LongTitles: Story = {
  render: () => (
    <SidebarWrapper
      tasks={[
        createTask(
          '1',
          'This is a very long task title that should be truncated properly',
          0,
          'Preview text'
        ),
        createTask(
          '2',
          'Another extremely long title for a task conversation',
          1,
          'More preview text here'
        ),
      ]}
    />
  ),
};
