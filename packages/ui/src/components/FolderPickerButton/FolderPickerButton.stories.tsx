import type { Meta, StoryObj } from '@storybook/react';
import { FolderPickerButton } from './FolderPickerButton';

const meta: Meta<typeof FolderPickerButton> = {
  title: 'Integrations/FolderPickerButton',
  component: FolderPickerButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A button component for selecting a folder, showing the current selection or a placeholder.',
      },
    },
  },
  argTypes: {
    folderName: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FolderPickerButton>;

export const Default: Story = {
  args: {},
};

export const WithFolder: Story = {
  args: {
    folderName: 'My Documents',
  },
};

export const WithLongFolderName: Story = {
  args: {
    folderName: 'Very Long Folder Name That Might Need Truncation',
  },
  decorators: [
    (Story) => (
      <div className="w-[250px]">
        <Story />
      </div>
    ),
  ],
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Choose destination folder...',
  },
};

export const Disabled: Story = {
  args: {
    folderName: 'My Artifacts',
    disabled: true,
  },
};

export const DisabledEmpty: Story = {
  args: {
    disabled: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <FolderPickerButton />
      <FolderPickerButton folderName="My Artifacts" />
      <FolderPickerButton folderName="Work Documents" />
      <FolderPickerButton disabled />
      <FolderPickerButton folderName="Disabled Folder" disabled />
    </div>
  ),
};
