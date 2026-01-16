import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef } from 'react';
import {
  CommandAutocomplete,
  type SlashCommandOption,
} from './CommandAutocomplete';

const sampleCommands: SlashCommandOption[] = [
  {
    id: '1',
    key: 'review-current',
    name: 'Team Review',
    description:
      'These are conversation instructions. Apply them to every message in this conversation at all times. Never lose this conversation-instructions, always go though it when a new message is submitted by the USER.',
    prompt:
      'Please review the current changes with the team for best practices and potential issues:',
  },
  {
    id: '2',
    key: 'phoenix',
    name: 'Phoenix Agent',
    description:
      'In order to understand this workspace, read the opened .code-workspace. It contains useful comments that you need to read and workspace folders paths. Do this first.',
    prompt: 'Use the Phoenix agent to process this request:',
  },
  {
    id: '3',
    key: 'prepare-commit-message',
    name: 'Git Commit Helper',
    description:
      'Analyze staged changes and generate a well-formatted commit message following conventional commits.',
    prompt: 'Please analyze the staged changes and prepare a commit message:',
  },
  {
    id: '4',
    key: 'agent-review',
    name: 'Agent Review',
    description:
      'Have the AI agent review your code for best practices, bugs, and improvements.',
    prompt: 'Please review this code thoroughly:',
  },
  {
    id: '5',
    key: 'explain',
    name: 'Explain Code',
    description:
      'Get a detailed explanation of how code works, including its purpose and implementation details.',
    prompt: 'Please explain the following code in detail:',
  },
  {
    id: '6',
    key: 'refactor',
    name: 'Refactor',
    description:
      'Suggest improvements and refactoring opportunities to make code cleaner and more maintainable.',
    prompt: 'Please suggest refactoring improvements for the following code:',
  },
  {
    id: '7',
    key: 'test',
    name: 'Write Tests',
    description:
      'Generate comprehensive unit tests for the code with good coverage.',
    prompt: 'Please write unit tests for the following code:',
  },
  {
    id: '8',
    key: 'summarize',
    name: 'Summarize',
    description: 'Get a brief summary of the content highlighting key points.',
    prompt: 'Please provide a brief summary of the following:',
  },
];

const meta: Meta<typeof CommandAutocomplete> = {
  title: 'Chat/Chat Components/CommandAutocomplete',
  component: CommandAutocomplete,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="pt-96 w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommandAutocomplete>;

const InteractiveComponent = () => {
  const [inputValue, setInputValue] = useState('/');
  const [isOpen, setIsOpen] = useState(true);
  const [selectedCommand, setSelectedCommand] =
    useState<SlashCommandOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (command: SlashCommandOption) => {
    setSelectedCommand(command);
    setInputValue('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Open autocomplete when "/" is typed at start or after whitespace
    const lastSlashIndex = value.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const charBefore = value[lastSlashIndex - 1];
      const isValidPosition =
        lastSlashIndex === 0 || /\s/.test(charBefore || '');
      const textAfterSlash = value.slice(lastSlashIndex + 1);
      const hasSpaceAfter = /\s/.test(textAfterSlash);

      setIsOpen(isValidPosition && !hasSpaceAfter);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedCommand && (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
          <span className="font-mono">/{selectedCommand.key}</span>
          <span className="text-muted-foreground">-</span>
          <span>{selectedCommand.name}</span>
          <button
            type="button"
            onClick={() => setSelectedCommand(null)}
            className="ml-1 hover:bg-primary/20 rounded p-0.5"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Type / to see commands..."
        className="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <CommandAutocomplete
        value={inputValue}
        anchorRef={inputRef}
        commands={sampleCommands}
        open={isOpen}
        onSelect={handleSelect}
        onClose={() => setIsOpen(false)}
      />
      <p className="text-xs text-muted-foreground">
        Try typing: /review, /explain, /test, or any partial match
      </p>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveComponent />,
};

const StaticDropdownComponent = ({
  commands,
  isLoading,
  searchValue = '/',
}: {
  commands: SlashCommandOption[];
  isLoading?: boolean;
  searchValue?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        readOnly
        className="w-full px-3 py-2 text-sm rounded-md border bg-background"
      />
      <CommandAutocomplete
        value={searchValue}
        anchorRef={inputRef}
        commands={commands}
        isLoading={isLoading}
        open={true}
        onSelect={() => {}}
        onClose={() => {}}
      />
    </div>
  );
};

export const WithCommands: Story = {
  render: () => (
    <StaticDropdownComponent commands={sampleCommands} searchValue="/" />
  ),
};

export const WithSearchFilter: Story = {
  render: () => (
    <StaticDropdownComponent commands={sampleCommands} searchValue="/re" />
  ),
};

export const Loading: Story = {
  render: () => (
    <StaticDropdownComponent commands={[]} isLoading={true} searchValue="/" />
  ),
};

export const Empty: Story = {
  render: () => <StaticDropdownComponent commands={[]} searchValue="/" />,
};

export const NoMatches: Story = {
  render: () => (
    <StaticDropdownComponent commands={sampleCommands} searchValue="/xyz" />
  ),
};

const ChipVisualizationComponent = () => {
  const selectedCommands: SlashCommandOption[] = [
    sampleCommands[0]!,
    sampleCommands[1]!,
    sampleCommands[2]!,
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Example chip visualization after selecting commands:
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedCommands.map((command) => (
          <div
            key={command.id}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
          >
            <span className="font-mono">/{command.key}</span>
            <span className="text-muted-foreground">-</span>
            <span>{command.name}</span>
            <button
              type="button"
              className="ml-1 hover:bg-primary/20 rounded p-0.5"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChipVisualization: Story = {
  render: () => <ChipVisualizationComponent />,
};
