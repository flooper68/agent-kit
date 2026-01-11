import type { Meta, StoryObj } from '@storybook/react';
import { FileTree } from './FileTree';

const meta: Meta<typeof FileTree> = {
  title: 'Components/FileTree',
  component: FileTree,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const singleFile = [
  {
    path: 'README.md',
    content: '# Hello World\n\nThis is a single file.',
  },
];

const flatFiles = [
  {
    path: 'README.md',
    content: '# Project README\n\nThis is the main documentation.',
  },
  {
    path: 'LICENSE',
    content: 'MIT License\n\nCopyright (c) 2025',
  },
  {
    path: 'package.json',
    content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}',
  },
];

const nestedFiles = [
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
    path: 'workflows/research.md',
    content:
      '# Research Workflow\n\n1. Define your research question\n2. Search for relevant sources\n3. Analyze and synthesize',
  },
  {
    path: 'workflows/fact-checking.md',
    content:
      '# Fact Checking Workflow\n\n1. Identify claims\n2. Find authoritative sources\n3. Verify information',
  },
];

const deeplyNestedFiles = [
  {
    path: 'src/index.ts',
    content: 'export * from "./components";\nexport * from "./utils";',
  },
  {
    path: 'src/components/Button.tsx',
    content:
      'export function Button({ children }) {\n  return <button>{children}</button>;\n}',
  },
  {
    path: 'src/components/Input.tsx',
    content:
      'export function Input(props) {\n  return <input {...props} />;\n}',
  },
  {
    path: 'src/utils/helpers.ts',
    content:
      'export function formatDate(date: Date) {\n  return date.toISOString();\n}',
  },
  {
    path: 'src/utils/validators/email.ts',
    content:
      'export function isValidEmail(email: string) {\n  return email.includes("@");\n}',
  },
  {
    path: 'src/utils/validators/phone.ts',
    content:
      'export function isValidPhone(phone: string) {\n  return /^\\d{10}$/.test(phone);\n}',
  },
  {
    path: 'docs/getting-started.md',
    content: '# Getting Started\n\n1. Install dependencies\n2. Run the app',
  },
  {
    path: 'docs/api/overview.md',
    content: '# API Overview\n\nThis section covers the API endpoints.',
  },
];

export const SingleFile: Story = {
  args: {
    files: singleFile,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const FlatFiles: Story = {
  args: {
    files: flatFiles,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const NestedFiles: Story = {
  args: {
    files: nestedFiles,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const DeeplyNested: Story = {
  args: {
    files: deeplyNestedFiles,
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const DefaultExpanded: Story = {
  args: {
    files: nestedFiles,
    defaultExpanded: ['references', 'workflows'],
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const NoFileContent: Story = {
  args: {
    files: nestedFiles,
    showFileContent: false,
    onFileSelect: (file) => {
      console.log('Selected file:', file.path);
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const CustomFileRenderer: Story = {
  args: {
    files: nestedFiles,
    renderFileContent: (file) => (
      <div className="rounded-md bg-blue-500/10 p-4">
        <p className="text-sm font-medium text-blue-600">
          Custom renderer for: {file.path}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {file.content.length} characters
        </p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    files: [],
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
