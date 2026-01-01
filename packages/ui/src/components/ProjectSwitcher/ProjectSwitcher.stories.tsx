import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ProjectSwitcher } from './ProjectSwitcher';
import type { Project } from './ProjectSwitcher';

const sampleProjects: Project[] = [
  { id: '1', name: 'Personal', avatarFallback: 'P' },
  { id: '2', name: 'Work', avatarFallback: 'W' },
  { id: '3', name: 'Side Project', avatarFallback: 'S' },
  { id: '4', name: 'Open Source Contribution', avatarFallback: 'O' },
];

const meta: Meta<typeof ProjectSwitcher> = {
  title: 'Components/ProjectSwitcher',
  component: ProjectSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isLoading: {
      control: 'boolean',
    },
  },
  args: {
    projects: sampleProjects,
    currentProject: sampleProjects[0]!,
    onSelect: fn(),
    onCreate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ProjectSwitcher>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithoutCreate: Story = {
  args: {
    onCreate: undefined,
  },
};

export const SingleProject: Story = {
  args: {
    projects: [sampleProjects[0]!],
    currentProject: sampleProjects[0]!,
  },
};

export const LongProjectName: Story = {
  args: {
    projects: [
      {
        id: '1',
        name: 'This is a very long project name that should truncate',
        avatarFallback: 'T',
      },
      ...sampleProjects,
    ],
    currentProject: {
      id: '1',
      name: 'This is a very long project name that should truncate',
      avatarFallback: 'T',
    },
  },
};

export const ManyProjects: Story = {
  args: {
    projects: [
      ...sampleProjects,
      { id: '5', name: 'Project Alpha', avatarFallback: 'A' },
      { id: '6', name: 'Project Beta', avatarFallback: 'B' },
      { id: '7', name: 'Project Gamma', avatarFallback: 'G' },
      { id: '8', name: 'Project Delta', avatarFallback: 'D' },
      { id: '9', name: 'Project Epsilon', avatarFallback: 'E' },
      { id: '10', name: 'Project Zeta', avatarFallback: 'Z' },
    ],
  },
};
