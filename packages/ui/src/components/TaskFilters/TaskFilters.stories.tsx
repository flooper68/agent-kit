import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TaskFilters, type TaskFiltersState } from './TaskFilters';

const meta: Meta<typeof TaskFilters> = {
  title: 'Planning/TaskFilters',
  component: TaskFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Filters for task lists with priority, status, and quick toggles.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskFilters>;

export const Default: Story = {
  args: {
    filters: {},
    onFiltersChange: () => {},
  },
};

export const WithPrioritySelected: Story = {
  args: {
    filters: { priority: 'high' },
    onFiltersChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'High priority filter is active.',
      },
    },
  },
};

export const WithStatusSelected: Story = {
  args: {
    filters: { status: 'in_progress' },
    onFiltersChange: () => {},
    showStatus: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Status filter active (shown in list view).',
      },
    },
  },
};

export const HasAttachments: Story = {
  args: {
    filters: { hasArtifacts: true },
    onFiltersChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Has attachments toggle is active.',
      },
    },
  },
};

export const MultipleFilters: Story = {
  args: {
    filters: {
      priority: 'urgent',
      hasArtifacts: true,
    },
    onFiltersChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple filters active at once.',
      },
    },
  },
};

export const AllFiltersActive: Story = {
  args: {
    filters: {
      priority: 'high',
      status: 'review',
      hasArtifacts: true,
    },
    onFiltersChange: () => {},
    showStatus: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Every filter has a value.',
      },
    },
  },
};

function InContextWrapper() {
  const [filters, setFilters] = useState<TaskFiltersState>({});
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Project Tasks</h2>
        <span className="text-sm text-muted-foreground">24 tasks</span>
      </div>
      <TaskFilters filters={filters} onFiltersChange={setFilters} />
      <div className="mt-4 p-8 bg-muted/30 rounded text-center text-muted-foreground">
        Task list would appear here
      </div>
    </div>
  );
}

export const InContext: Story = {
  render: () => <InContextWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Example of TaskFilters in a project context.',
      },
    },
  },
};
