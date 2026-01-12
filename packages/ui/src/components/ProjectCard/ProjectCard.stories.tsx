import type { Meta, StoryObj } from '@storybook/react';
import { ProjectCard } from './ProjectCard';

const meta: Meta<typeof ProjectCard> = {
  title: 'Planning/ProjectCard',
  component: ProjectCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A card displaying project information with task progress.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const Default: Story = {
  args: {
    title: 'Website Redesign',
    summary: 'Redesign the company website with new branding and improved UX.',
    taskCounts: {
      backlog: 0,
      todo: 5,
      inProgress: 3,
      review: 2,
      done: 10,
      total: 20,
    },
    documentCount: 5,
  },
};

export const WithoutSummary: Story = {
  args: {
    title: 'Quick Tasks',
    taskCounts: {
      backlog: 0,
      todo: 3,
      inProgress: 1,
      review: 0,
      done: 6,
      total: 10,
    },
    documentCount: 1,
  },
};

export const EmptyProject: Story = {
  args: {
    title: 'New Project',
    summary: 'A brand new project without any tasks yet.',
    taskCounts: {
      backlog: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      total: 0,
    },
    documentCount: 0,
  },
};

export const ManyTasks: Story = {
  args: {
    title: 'Enterprise Migration',
    summary: 'Large-scale system migration with hundreds of tasks.',
    taskCounts: {
      backlog: 0,
      todo: 45,
      inProgress: 23,
      review: 12,
      done: 120,
      total: 200,
    },
    documentCount: 42,
  },
};

export const LongTitle: Story = {
  args: {
    title:
      'This is a very long project title that should wrap to multiple lines when necessary',
    summary: 'A project with a long title.',
    taskCounts: {
      backlog: 0,
      todo: 2,
      inProgress: 1,
      review: 0,
      done: 7,
      total: 10,
    },
    documentCount: 3,
  },
};

export const LongSummary: Story = {
  args: {
    title: 'API Integration',
    summary:
      'This is a very long summary that describes the project in great detail. It should be truncated with an ellipsis when it exceeds the available space in the card layout.',
    taskCounts: {
      backlog: 0,
      todo: 4,
      inProgress: 2,
      review: 1,
      done: 3,
      total: 10,
    },
    documentCount: 8,
  },
};

export const Clickable: Story = {
  args: {
    title: 'Clickable Project',
    summary: 'Hover over this card to see the interaction state.',
    taskCounts: {
      backlog: 0,
      todo: 3,
      inProgress: 2,
      review: 1,
      done: 4,
      total: 10,
    },
    documentCount: 2,
    onClick: () => console.log('Project clicked!'),
  },
};

export const AllTasksDone: Story = {
  args: {
    title: 'Completed Project',
    summary: 'All tasks have been completed.',
    taskCounts: {
      backlog: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 15,
      total: 15,
    },
    documentCount: 12,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard
        title="Project Alpha"
        summary="First project in the grid"
        taskCounts={{
          backlog: 0,
          todo: 5,
          inProgress: 2,
          review: 1,
          done: 7,
          total: 15,
        }}
        documentCount={3}
        onClick={() => {}}
      />
      <ProjectCard
        title="Project Beta"
        summary="Second project in the grid"
        taskCounts={{
          backlog: 0,
          todo: 3,
          inProgress: 4,
          review: 2,
          done: 11,
          total: 20,
        }}
        documentCount={7}
        onClick={() => {}}
      />
      <ProjectCard
        title="Project Gamma"
        summary="Third project in the grid"
        taskCounts={{
          backlog: 0,
          todo: 0,
          inProgress: 0,
          review: 0,
          done: 10,
          total: 10,
        }}
        documentCount={15}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProjectCards displayed in a responsive grid layout.',
      },
    },
  },
};
