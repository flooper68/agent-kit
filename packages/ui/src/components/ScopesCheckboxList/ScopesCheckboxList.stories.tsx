import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ScopesCheckboxList, type ScopeOption } from './ScopesCheckboxList';

const meta: Meta<typeof ScopesCheckboxList> = {
  title: 'Primitives/ScopesCheckboxList',
  component: ScopesCheckboxList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScopesCheckboxList>;

const sampleScopes: ScopeOption[] = [
  {
    id: 'artifacts:read',
    label: 'Read Artifacts',
    description: 'Allow reading and searching saved documents',
    category: 'Artifacts',
  },
  {
    id: 'artifacts:write',
    label: 'Write Artifacts',
    description: 'Allow creating and updating documents',
    category: 'Artifacts',
  },
];

const multiCategoryScopes: ScopeOption[] = [
  ...sampleScopes,
  {
    id: 'projects:read',
    label: 'Read Projects',
    description: 'Allow viewing project information',
    category: 'Projects',
  },
  {
    id: 'projects:write',
    label: 'Write Projects',
    description: 'Allow creating and modifying projects',
    category: 'Projects',
  },
  {
    id: 'tasks:read',
    label: 'Read Tasks',
    description: 'Allow viewing tasks and their status',
    category: 'Tasks',
  },
  {
    id: 'tasks:write',
    label: 'Write Tasks',
    description: 'Allow creating and updating tasks',
    category: 'Tasks',
  },
];

function DefaultRender() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="w-80">
      <ScopesCheckboxList
        scopes={sampleScopes}
        selectedScopes={selected}
        onChange={setSelected}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Selected: {selected.length === 0 ? 'None' : selected.join(', ')}
      </p>
    </div>
  );
}

export const Default: Story = {
  render: DefaultRender,
};

function WithSelectedRender() {
  const [selected, setSelected] = useState<string[]>(['artifacts:read']);
  return (
    <div className="w-80">
      <ScopesCheckboxList
        scopes={sampleScopes}
        selectedScopes={selected}
        onChange={setSelected}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Selected: {selected.length === 0 ? 'None' : selected.join(', ')}
      </p>
    </div>
  );
}

export const WithSelected: Story = {
  render: WithSelectedRender,
};

function AllSelectedRender() {
  const [selected, setSelected] = useState<string[]>([
    'artifacts:read',
    'artifacts:write',
  ]);
  return (
    <div className="w-80">
      <ScopesCheckboxList
        scopes={sampleScopes}
        selectedScopes={selected}
        onChange={setSelected}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Selected: {selected.length === 0 ? 'None' : selected.join(', ')}
      </p>
    </div>
  );
}

export const AllSelected: Story = {
  render: AllSelectedRender,
};

function DisabledRender() {
  const [selected] = useState<string[]>(['artifacts:read']);
  return (
    <div className="w-80">
      <ScopesCheckboxList
        scopes={sampleScopes}
        selectedScopes={selected}
        onChange={() => {}}
        disabled
      />
      <p className="mt-4 text-xs text-muted-foreground">Disabled state</p>
    </div>
  );
}

export const Disabled: Story = {
  render: DisabledRender,
};

function MultipleCategoriesRender() {
  const [selected, setSelected] = useState<string[]>([
    'artifacts:read',
    'tasks:read',
  ]);
  return (
    <div className="w-96">
      <ScopesCheckboxList
        scopes={multiCategoryScopes}
        selectedScopes={selected}
        onChange={setSelected}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Selected: {selected.length === 0 ? 'None' : selected.join(', ')}
      </p>
    </div>
  );
}

export const MultipleCategories: Story = {
  render: MultipleCategoriesRender,
};

function EmptyRender() {
  return (
    <div className="w-80">
      <ScopesCheckboxList scopes={[]} selectedScopes={[]} onChange={() => {}} />
    </div>
  );
}

export const Empty: Story = {
  render: EmptyRender,
};

function InFormRender() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="w-96 space-y-4 p-4 border rounded-lg">
      <div>
        <h3 className="text-sm font-medium">Permissions</h3>
        <p className="text-xs text-muted-foreground">
          Grant this agent access to specific capabilities
        </p>
      </div>
      <ScopesCheckboxList
        scopes={sampleScopes}
        selectedScopes={selected}
        onChange={setSelected}
      />
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Agents have no permissions by default. Grant
          only the permissions this agent needs.
        </p>
      </div>
    </div>
  );
}

export const InForm: Story = {
  render: InFormRender,
};
