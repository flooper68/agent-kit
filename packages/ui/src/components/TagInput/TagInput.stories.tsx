import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TagInput, type Tag } from './TagInput';

const meta: Meta<typeof TagInput> = {
  title: 'Components/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A chip-based input component for selecting and creating tags with autocomplete suggestions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagInput>;

const sampleSuggestions: Tag[] = [
  { id: 'documentation', label: 'documentation', color: 'blue' },
  { id: 'api', label: 'api', color: 'purple' },
  { id: 'important', label: 'important', color: 'red' },
  { id: 'draft', label: 'draft', color: 'yellow' },
  { id: 'reviewed', label: 'reviewed', color: 'green' },
  { id: 'archived', label: 'archived', color: 'gray' },
  { id: 'frontend', label: 'frontend', color: 'teal' },
  { id: 'backend', label: 'backend', color: 'orange' },
  { id: 'design', label: 'design', color: 'pink' },
];

function TagInputDemo({
  initialTags = [],
  ...props
}: Omit<React.ComponentProps<typeof TagInput>, 'value' | 'onChange'> & {
  initialTags?: Tag[];
}) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  return <TagInput {...props} value={tags} onChange={setTags} />;
}

export const Default: Story = {
  render: () => <TagInputDemo />,
};

export const WithSuggestions: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      placeholder="Type to search tags..."
    />
  ),
};

export const WithPreselectedTags: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      initialTags={[
        { id: 'documentation', label: 'documentation', color: 'blue' },
        { id: 'important', label: 'important', color: 'red' },
      ]}
    />
  ),
};

export const AllowCreate: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Allow creating new tags (default):
        </p>
        <TagInputDemo
          suggestions={sampleSuggestions}
          allowCreate={true}
          placeholder="Type a new tag name and press Enter..."
        />
      </div>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Only allow selection from suggestions:
        </p>
        <TagInputDemo
          suggestions={sampleSuggestions}
          allowCreate={false}
          placeholder="Select from existing tags..."
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const MaxTagsLimit: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      maxTags={3}
      placeholder="Maximum 3 tags..."
      initialTags={[
        { id: 'documentation', label: 'documentation', color: 'blue' },
      ]}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      isLoading={true}
      placeholder="Loading suggestions..."
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      disabled={true}
      initialTags={[
        { id: 'documentation', label: 'documentation', color: 'blue' },
        { id: 'reviewed', label: 'reviewed', color: 'green' },
      ]}
    />
  ),
};

export const ManyTags: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      initialTags={[
        { id: 'documentation', label: 'documentation', color: 'blue' },
        { id: 'api', label: 'api', color: 'purple' },
        { id: 'important', label: 'important', color: 'red' },
        { id: 'draft', label: 'draft', color: 'yellow' },
        { id: 'reviewed', label: 'reviewed', color: 'green' },
        { id: 'frontend', label: 'frontend', color: 'teal' },
        { id: 'backend', label: 'backend', color: 'orange' },
      ]}
    />
  ),
};

export const MediumSize: Story = {
  render: () => (
    <TagInputDemo
      suggestions={sampleSuggestions}
      tagSize="md"
      initialTags={[
        { id: 'documentation', label: 'documentation', color: 'blue' },
        { id: 'important', label: 'important', color: 'red' },
      ]}
    />
  ),
};
