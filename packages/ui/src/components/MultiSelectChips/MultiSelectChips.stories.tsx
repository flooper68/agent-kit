import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MultiSelectChips, type MultiSelectOption } from './MultiSelectChips';

const agentOptions: MultiSelectOption[] = [
  {
    value: 'research-agent',
    label: 'Research Agent',
    description: 'Specialized in web research and data gathering',
    badge: 'Server',
    badgeVariant: 'default',
  },
  {
    value: 'code-reviewer',
    label: 'Code Reviewer',
    description: 'Reviews code for best practices and potential issues',
    badge: 'Server',
    badgeVariant: 'default',
  },
  {
    value: 'external-analyst',
    label: 'External Analyst',
    description: 'Connected via WebSocket for real-time analysis',
    badge: 'External',
    badgeVariant: 'secondary',
  },
  {
    value: 'task-planner',
    label: 'Task Planner',
    description: 'Breaks down complex tasks into manageable steps',
    badge: 'Server',
    badgeVariant: 'default',
  },
  {
    value: 'qa-agent',
    label: 'QA Agent',
    description: 'Quality assurance and testing specialist',
    badge: 'External',
    badgeVariant: 'secondary',
  },
];

const simpleOptions: MultiSelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
];

const meta: Meta<typeof MultiSelectChips> = {
  title: 'Primitives/MultiSelectChips',
  component: MultiSelectChips,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
  },
  args: {
    options: agentOptions,
    placeholder: 'Search agents...',
    addLabel: 'Add Agent',
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelectChips>;

// Controlled component wrapper for stories
function ControlledMultiSelect({
  initialValue = [],
  ...props
}: Omit<React.ComponentProps<typeof MultiSelectChips>, 'value' | 'onChange'> & {
  initialValue?: string[];
}) {
  const [value, setValue] = useState<string[]>(initialValue);
  return <MultiSelectChips {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <ControlledMultiSelect {...args} />,
};

export const WithPreselectedItems: Story = {
  render: (args) => (
    <ControlledMultiSelect
      {...args}
      initialValue={['research-agent', 'external-analyst']}
    />
  ),
};

export const WithBadges: Story = {
  render: (args) => (
    <ControlledMultiSelect
      {...args}
      options={agentOptions}
      initialValue={['research-agent', 'external-analyst', 'task-planner']}
    />
  ),
};

export const SimpleOptions: Story = {
  render: () => (
    <ControlledMultiSelect
      options={simpleOptions}
      placeholder="Search fruits..."
      addLabel="Add Fruit"
    />
  ),
};

export const Loading: Story = {
  render: (args) => <ControlledMultiSelect {...args} isLoading />,
};

export const Disabled: Story = {
  render: (args) => (
    <ControlledMultiSelect
      {...args}
      disabled
      initialValue={['research-agent', 'code-reviewer']}
    />
  ),
};

export const Empty: Story = {
  render: (args) => (
    <ControlledMultiSelect {...args} options={[]} addLabel="Add" />
  ),
};

export const ManySelections: Story = {
  render: (args) => (
    <ControlledMultiSelect
      {...args}
      initialValue={agentOptions.map((o) => o.value)}
    />
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-8 w-[400px]">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Default (empty)
        </label>
        <ControlledMultiSelect
          options={agentOptions}
          placeholder="Search..."
          addLabel="Add Agent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          With selections
        </label>
        <ControlledMultiSelect
          options={agentOptions}
          placeholder="Search..."
          addLabel="Add Agent"
          initialValue={['research-agent', 'external-analyst']}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Loading
        </label>
        <ControlledMultiSelect
          options={agentOptions}
          placeholder="Loading..."
          addLabel="Add Agent"
          isLoading
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Disabled
        </label>
        <ControlledMultiSelect
          options={agentOptions}
          placeholder="Search..."
          addLabel="Add Agent"
          disabled
          initialValue={['research-agent']}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Simple options (no badges)
        </label>
        <ControlledMultiSelect
          options={simpleOptions}
          placeholder="Search fruits..."
          addLabel="Add Fruit"
          initialValue={['apple', 'cherry']}
        />
      </div>
    </div>
  ),
};

export const InForm: Story = {
  render: () => (
    <div className="space-y-4 w-[500px] p-4 border rounded-lg">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Agent Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure which agents this agent can spawn.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Allowed Sub-Agents</label>
        <ControlledMultiSelect
          options={agentOptions}
          placeholder="Search agents..."
          addLabel="Add Agent"
          initialValue={['research-agent']}
        />
        <p className="text-xs text-muted-foreground">
          Select the agents that can be spawned by this agent. If none are
          selected, this agent cannot spawn any sub-agents.
        </p>
      </div>
    </div>
  ),
};
