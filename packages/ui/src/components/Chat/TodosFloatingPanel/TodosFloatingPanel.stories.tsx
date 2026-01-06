import type { Meta, StoryObj } from '@storybook/react';
import { TodosFloatingPanel } from './TodosFloatingPanel';
import type { TodoItem } from '../../../types/chat';

const meta: Meta<typeof TodosFloatingPanel> = {
  title: 'Chat/TodosFloatingPanel',
  component: TodosFloatingPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px] p-4 bg-muted/20">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TodosFloatingPanel>;

const mixedTodos: TodoItem[] = [
  {
    content: 'Search for tool implementations',
    status: 'completed',
    activeForm: 'Searching for tool implementations',
  },
  {
    content: 'Analyze the tool system architecture',
    status: 'in_progress',
    activeForm: 'Analyzing the tool system architecture',
  },
  {
    content: 'Review existing patterns',
    status: 'pending',
    activeForm: 'Reviewing existing patterns',
  },
  {
    content: 'Create implementation plan',
    status: 'pending',
    activeForm: 'Creating implementation plan',
  },
];

export const Default: Story = {
  args: {
    todos: mixedTodos,
  },
};

export const AllPending: Story = {
  args: {
    todos: [
      {
        content: 'First task to do',
        status: 'pending',
        activeForm: 'Working on first task',
      },
      {
        content: 'Second task to do',
        status: 'pending',
        activeForm: 'Working on second task',
      },
      {
        content: 'Third task to do',
        status: 'pending',
        activeForm: 'Working on third task',
      },
    ],
  },
};

export const AllCompleted: Story = {
  args: {
    todos: [
      {
        content: 'Completed task one',
        status: 'completed',
        activeForm: 'Completing task one',
      },
      {
        content: 'Completed task two',
        status: 'completed',
        activeForm: 'Completing task two',
      },
      {
        content: 'Completed task three',
        status: 'completed',
        activeForm: 'Completing task three',
      },
    ],
  },
};

export const InProgress: Story = {
  args: {
    todos: [
      {
        content: 'Running tests',
        status: 'in_progress',
        activeForm: 'Running tests and validating results',
      },
    ],
  },
};

export const ManyItems: Story = {
  args: {
    todos: [
      {
        content: 'Task 1',
        status: 'completed',
        activeForm: 'Working on task 1',
      },
      {
        content: 'Task 2',
        status: 'completed',
        activeForm: 'Working on task 2',
      },
      {
        content: 'Task 3',
        status: 'completed',
        activeForm: 'Working on task 3',
      },
      {
        content: 'Task 4',
        status: 'in_progress',
        activeForm: 'Working on task 4',
      },
      { content: 'Task 5', status: 'pending', activeForm: 'Working on task 5' },
      { content: 'Task 6', status: 'pending', activeForm: 'Working on task 6' },
      { content: 'Task 7', status: 'pending', activeForm: 'Working on task 7' },
      { content: 'Task 8', status: 'pending', activeForm: 'Working on task 8' },
      { content: 'Task 9', status: 'pending', activeForm: 'Working on task 9' },
      {
        content: 'Task 10',
        status: 'pending',
        activeForm: 'Working on task 10',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    todos: [],
  },
};
