import type { Meta, StoryObj } from '@storybook/react';
import { DueDateIndicator } from './DueDateIndicator';

const meta: Meta<typeof DueDateIndicator> = {
  title: 'Planning/DueDateIndicator',
  component: DueDateIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a due date with color-coded urgency indicators.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DueDateIndicator>;

// Helper to create dates relative to today
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const Overdue: Story = {
  args: {
    dueDate: daysFromNow(-3),
  },
  parameters: {
    docs: {
      description: {
        story: 'Red indicator for tasks past their due date.',
      },
    },
  },
};

export const DueToday: Story = {
  args: {
    dueDate: daysFromNow(0),
  },
  parameters: {
    docs: {
      description: {
        story: 'Orange indicator for tasks due today.',
      },
    },
  },
};

export const DueTomorrow: Story = {
  args: {
    dueDate: daysFromNow(1),
  },
};

export const DueThisWeek: Story = {
  args: {
    dueDate: daysFromNow(5),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows day name for dates within the next week.',
      },
    },
  },
};

export const DueLater: Story = {
  args: {
    dueDate: daysFromNow(14),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows month and day for dates beyond a week.',
      },
    },
  },
};

export const NoDueDate: Story = {
  args: {
    dueDate: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Returns null when no due date is set.',
      },
    },
  },
};

export const CompletedTask: Story = {
  args: {
    dueDate: daysFromNow(-1),
    completedAt: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Completed tasks show normal styling even if overdue.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-muted-foreground">Overdue:</span>
        <DueDateIndicator dueDate={daysFromNow(-3)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-muted-foreground">Today:</span>
        <DueDateIndicator dueDate={daysFromNow(0)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-muted-foreground">Tomorrow:</span>
        <DueDateIndicator dueDate={daysFromNow(1)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-muted-foreground">This week:</span>
        <DueDateIndicator dueDate={daysFromNow(5)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-muted-foreground">Later:</span>
        <DueDateIndicator dueDate={daysFromNow(14)} />
      </div>
    </div>
  ),
};
