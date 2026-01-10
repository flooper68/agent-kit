import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EditableFileTree } from './EditableFileTree';
import type { FileItem } from '../FileTree/types';

const meta: Meta<typeof EditableFileTree> = {
  title: 'Components/EditableFileTree',
  component: EditableFileTree,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultFolders = ['references', 'assets'];

const emptyFiles: FileItem[] = [
  { path: 'SKILL.md', content: '# My Skill\n\nDescription here...' },
];

const filesWithContent: FileItem[] = [
  {
    path: 'SKILL.md',
    content:
      '# Web Research Skill\n\nThis skill teaches agents how to research topics on the web.',
  },
  {
    path: 'references/api.md',
    content:
      '# API Reference\n\n## searchWeb(query)\n\nSearches the web for the given query.',
  },
  {
    path: 'references/examples.md',
    content:
      '# Examples\n\n## Basic Search\n\n```typescript\nawait searchWeb("latest news");\n```',
  },
  {
    path: 'assets/template.md',
    content:
      '# Research Template\n\n## Topic: {{topic}}\n\n### Key Findings\n\n1. ...\n2. ...',
  },
  { path: 'LICENSE.txt', content: 'MIT License\n\nCopyright (c) 2025' },
];

// Interactive wrapper component for stories
function InteractiveEditableFileTree({
  initialFiles,
  initialSelected,
}: {
  initialFiles: FileItem[];
  initialSelected: string | null;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedPath, setSelectedPath] = useState(initialSelected);

  return (
    <div className="w-[280px]">
      <EditableFileTree
        files={files}
        selectedPath={selectedPath}
        onFilesChange={setFiles}
        onFileSelect={setSelectedPath}
        defaultFolders={defaultFolders}
      />
      <div className="mt-4 rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Selected: {selectedPath || 'none'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Files: {files.length}
        </p>
      </div>
    </div>
  );
}

function NoFoldersTree() {
  const [files, setFiles] = useState<FileItem[]>([
    { path: 'SKILL.md', content: '# Skill' },
    { path: 'README.md', content: '# README' },
  ]);
  const [selectedPath, setSelectedPath] = useState<string | null>('SKILL.md');

  return (
    <div className="w-[280px]">
      <EditableFileTree
        files={files}
        selectedPath={selectedPath}
        onFilesChange={setFiles}
        onFileSelect={setSelectedPath}
        defaultFolders={[]}
      />
    </div>
  );
}

export const Empty: Story = {
  render: () => (
    <InteractiveEditableFileTree
      initialFiles={emptyFiles}
      initialSelected="SKILL.md"
    />
  ),
};

export const WithFiles: Story = {
  render: () => (
    <InteractiveEditableFileTree
      initialFiles={filesWithContent}
      initialSelected="SKILL.md"
    />
  ),
};

export const Disabled: Story = {
  args: {
    files: filesWithContent,
    selectedPath: 'SKILL.md',
    onFilesChange: () => {},
    onFileSelect: () => {},
    defaultFolders: defaultFolders,
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
};

export const NoFolders: Story = {
  render: () => <NoFoldersTree />,
};
