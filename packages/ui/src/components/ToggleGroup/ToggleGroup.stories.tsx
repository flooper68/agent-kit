import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ToggleGroup } from './ToggleGroup';
import { Tooltip, TooltipProvider } from '../Tooltip';
import {
  LayoutGrid,
  List,
  Calendar,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
  Circle,
  Clock,
  Eye,
  CheckCircle,
  Inbox,
} from 'lucide-react';

const meta: Meta<typeof ToggleGroup> = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

function DefaultRender() {
  const [value, setValue] = useState('option1');
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroup.Item value="option1">Option 1</ToggleGroup.Item>
      <ToggleGroup.Item value="option2">Option 2</ToggleGroup.Item>
      <ToggleGroup.Item value="option3">Option 3</ToggleGroup.Item>
    </ToggleGroup>
  );
}

export const Default: Story = {
  render: DefaultRender,
};

function WithIconsRender() {
  const [value, setValue] = useState('grid');
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroup.Item value="grid">
        <LayoutGrid className="h-4 w-4 mr-1" />
        Grid
      </ToggleGroup.Item>
      <ToggleGroup.Item value="list">
        <List className="h-4 w-4 mr-1" />
        List
      </ToggleGroup.Item>
      <ToggleGroup.Item value="calendar">
        <Calendar className="h-4 w-4 mr-1" />
        Calendar
      </ToggleGroup.Item>
    </ToggleGroup>
  );
}

export const WithIcons: Story = {
  render: WithIconsRender,
};

function IconsOnlyRender() {
  const [value, setValue] = useState('grid');
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroup.Item value="grid" aria-label="Grid view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="calendar" aria-label="Calendar view">
        <Calendar className="h-4 w-4" />
      </ToggleGroup.Item>
    </ToggleGroup>
  );
}

export const IconsOnly: Story = {
  render: IconsOnlyRender,
};

function WithTooltipsRender() {
  const [value, setValue] = useState('grid');
  return (
    <TooltipProvider>
      <ToggleGroup value={value} onValueChange={(v) => setValue(v as string)}>
        <Tooltip content="Grid view">
          <ToggleGroup.Item value="grid">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroup.Item>
        </Tooltip>
        <Tooltip content="List view">
          <ToggleGroup.Item value="list">
            <List className="h-4 w-4" />
          </ToggleGroup.Item>
        </Tooltip>
        <Tooltip content="Calendar view">
          <ToggleGroup.Item value="calendar">
            <Calendar className="h-4 w-4" />
          </ToggleGroup.Item>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}

export const WithTooltips: Story = {
  render: WithTooltipsRender,
};

function SizesRender() {
  const [sm, setSm] = useState('a');
  const [md, setMd] = useState('a');
  const [lg, setLg] = useState('a');
  return (
    <div className="flex flex-col gap-4 items-start">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Small</p>
        <ToggleGroup
          size="sm"
          value={sm}
          onValueChange={(v) => setSm(v as string)}
        >
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
          <ToggleGroup.Item value="c">C</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Medium (default)</p>
        <ToggleGroup
          size="md"
          value={md}
          onValueChange={(v) => setMd(v as string)}
        >
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
          <ToggleGroup.Item value="c">C</ToggleGroup.Item>
        </ToggleGroup>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Large</p>
        <ToggleGroup
          size="lg"
          value={lg}
          onValueChange={(v) => setLg(v as string)}
        >
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
          <ToggleGroup.Item value="c">C</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}

export const Sizes: Story = {
  render: SizesRender,
};

function StatusRender() {
  const [value, setValue] = useState('todo');
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Status (with color schemes)</p>
      <TooltipProvider>
        <ToggleGroup
          value={value}
          onValueChange={(v) => setValue(v as string)}
          size="sm"
        >
          <Tooltip content="Backlog">
            <ToggleGroup.Item value="backlog" colorScheme="slate">
              <Inbox className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="Todo">
            <ToggleGroup.Item value="todo">
              <Circle className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="In Progress">
            <ToggleGroup.Item value="in_progress" colorScheme="blue">
              <Clock className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="Review">
            <ToggleGroup.Item value="review" colorScheme="amber">
              <Eye className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="Done">
            <ToggleGroup.Item value="done" colorScheme="green">
              <CheckCircle className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
}

export const Status: Story = {
  render: StatusRender,
};

function PriorityRender() {
  const [value, setValue] = useState('medium');
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Priority (with color schemes)</p>
      <TooltipProvider>
        <ToggleGroup
          value={value}
          onValueChange={(v) => setValue(v as string)}
          size="sm"
        >
          <Tooltip content="Low">
            <ToggleGroup.Item value="low" colorScheme="green">
              <ArrowDown className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="Medium">
            <ToggleGroup.Item value="medium" colorScheme="amber">
              <Minus className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="High">
            <ToggleGroup.Item value="high" colorScheme="orange">
              <ArrowUp className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
          <Tooltip content="Urgent">
            <ToggleGroup.Item value="urgent" colorScheme="red">
              <AlertTriangle className="h-4 w-4" />
            </ToggleGroup.Item>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
}

export const Priority: Story = {
  render: PriorityRender,
};

function PriorityWithLabelsRender() {
  const [value, setValue] = useState('medium');
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Priority (with labels)</p>
      <ToggleGroup
        value={value}
        onValueChange={(v) => setValue(v as string)}
        size="sm"
        fullWidth
      >
        <ToggleGroup.Item value="low" colorScheme="green">
          Low
        </ToggleGroup.Item>
        <ToggleGroup.Item value="medium" colorScheme="amber">
          Medium
        </ToggleGroup.Item>
        <ToggleGroup.Item value="high" colorScheme="orange">
          High
        </ToggleGroup.Item>
        <ToggleGroup.Item value="urgent" colorScheme="red">
          Urgent
        </ToggleGroup.Item>
      </ToggleGroup>
    </div>
  );
}

export const PriorityWithLabels: Story = {
  render: PriorityWithLabelsRender,
};

function FullWidthRender() {
  const [value, setValue] = useState('option1');
  return (
    <div className="w-80">
      <ToggleGroup
        fullWidth
        value={value}
        onValueChange={(v) => setValue(v as string)}
      >
        <ToggleGroup.Item value="option1">Option 1</ToggleGroup.Item>
        <ToggleGroup.Item value="option2">Option 2</ToggleGroup.Item>
        <ToggleGroup.Item value="option3">Option 3</ToggleGroup.Item>
      </ToggleGroup>
    </div>
  );
}

export const FullWidth: Story = {
  render: FullWidthRender,
};

function WithDisabledItemRender() {
  const [value, setValue] = useState('option1');
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroup.Item value="option1">Option 1</ToggleGroup.Item>
      <ToggleGroup.Item value="option2" disabled>
        Disabled
      </ToggleGroup.Item>
      <ToggleGroup.Item value="option3">Option 3</ToggleGroup.Item>
    </ToggleGroup>
  );
}

export const WithDisabledItem: Story = {
  render: WithDisabledItemRender,
};

function MultipleRender() {
  const [values, setValues] = useState<string[]>(['bold']);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Selected: {values.join(', ') || 'none'}
      </p>
      <ToggleGroup
        type="multiple"
        value={values}
        onValueChange={(v) => setValues(v as string[])}
      >
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup>
    </div>
  );
}

export const Multiple: Story = {
  render: MultipleRender,
};
