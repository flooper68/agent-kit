import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TaskHistorySidebar } from './TaskHistorySidebar';
import type { SessionFilter } from '../SessionFilterDropdown';
import { Button } from '../../../Button';
import type { TaskHistoryItem } from '../../../../types/chat';

const createTask = (
  id: string,
  title: string,
  daysAgo: number,
  preview?: string,
  agentName?: string,
  totalTokens?: number
): TaskHistoryItem => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    title,
    preview,
    createdAt: date,
    updatedAt: date,
    agentName,
    totalTokens,
  };
};

const sampleTasks: TaskHistoryItem[] = [
  createTask(
    '1',
    'Help with React hooks',
    0,
    'Can you explain useEffect cleanup functions?',
    'GPT-4o',
    12500
  ),
  createTask(
    '2',
    'TypeScript generics',
    1,
    'I need help understanding generic constraints',
    'Claude Sonnet',
    8200
  ),
  createTask(
    '3',
    'API design patterns',
    2,
    'What are best practices for REST API design?',
    'GPT-4o',
    45000
  ),
  createTask(
    '4',
    'Database optimization',
    5,
    'How can I improve my PostgreSQL query performance?',
    'Gemini Pro',
    3100
  ),
  createTask(
    '5',
    'Testing strategies',
    8,
    'What testing approach should I use for a React app?',
    'Claude Sonnet',
    156000
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
  showFilter = false,
  hasNextPage = false,
  hasPreviousPage = false,
  onNextPage,
  onPreviousPage,
}: {
  tasks?: TaskHistoryItem[];
  selectedTaskId?: string;
  showFilter?: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(selectedTaskId);
  const [filter, setFilter] = useState<SessionFilter>('my_chats');

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
        filter={showFilter ? filter : undefined}
        onFilterChange={
          showFilter
            ? (newFilter) => {
                setFilter(newFilter);
                console.log('Filter changed:', newFilter);
              }
            : undefined
        }
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
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

const agents = ['GPT-4o', 'Claude Sonnet', 'Gemini Pro'];

export const ManyTasks: Story = {
  render: () => (
    <SidebarWrapper
      tasks={Array.from({ length: 20 }, (_, i) =>
        createTask(
          `task-${i + 1}`,
          `Task conversation ${i + 1}`,
          i,
          `This is a preview of task ${i + 1} with some sample content...`,
          agents[i % agents.length],
          Math.floor(Math.random() * 100000) + 1000
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

export const WithFilter: Story = {
  render: () => <SidebarWrapper showFilter />,
};

// Pagination story with interactive state
const PaginatedSidebarWrapper = () => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<SessionFilter>('my_chats');
  const pageSize = 5;

  const allTasks = Array.from({ length: 25 }, (_, i) =>
    createTask(
      `task-${i + 1}`,
      `Task conversation ${i + 1}`,
      i,
      `This is a preview of task ${i + 1} with some sample content...`,
      agents[i % agents.length],
      Math.floor(Math.random() * 100000) + 1000
    )
  );

  const paginatedTasks = allTasks.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Task History</Button>
      <TaskHistorySidebar
        open={open}
        onOpenChange={setOpen}
        tasks={paginatedTasks}
        onTaskSelect={(id) => console.log('Selected:', id)}
        onTaskDelete={(id) => console.log('Delete:', id)}
        filter={filter}
        onFilterChange={(newFilter) => {
          setFilter(newFilter);
          setPage(0); // Reset page when filter changes
          console.log('Filter changed:', newFilter);
        }}
        hasNextPage={(page + 1) * pageSize < allTasks.length}
        hasPreviousPage={page > 0}
        onNextPage={() => setPage((p) => p + 1)}
        onPreviousPage={() => setPage((p) => p - 1)}
      />
    </>
  );
};

export const WithPagination: Story = {
  render: () => <PaginatedSidebarWrapper />,
};
