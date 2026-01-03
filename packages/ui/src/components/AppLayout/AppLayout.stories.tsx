import { useState, useCallback, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Settings,
  Home,
  FileText,
  Zap,
  Share,
  Bell,
  LayoutDashboard,
  Code,
  Sparkles,
  History,
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { AppLayout } from './AppLayout';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';
import { Heading } from '../Typography/Heading';
import { Text } from '../Typography/Text';
import { AgentPanel } from '../Chat/AgentPanel';
import type { AgentPanelRef } from '../Chat/AgentPanel/types';
import { MockChatService } from '../Chat/AgentPanel/mocks/MockChatService';
import { TaskHistorySidebar } from '../Chat/Sidebar/TaskHistorySidebar';
import type {
  TaskMessage,
  TaskStatus,
  SuggestionChip,
  ThinkingStatus,
  TaskHistoryItem,
} from '../../types/chat';
import type { TaskError } from '../Chat/AgentPanel/types';
import type { MainMenuConfig, MoreMenuConfig } from './types';

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AppLayout provides a complete application shell with:
- Configurable header with main menu, panel toggle, tool buttons, navigation, status, and actions
- Collapsible and resizable assistant panel
- Main content area

The layout is designed to integrate with AgentPanel for AI-assisted workflows.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

// ============================================
// Full Featured Layout
// ============================================

const FullFeaturedComponent = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('ready');
  const [error, setError] = useState<TaskError | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus>({
    isThinking: false,
  });

  const panelRef = useRef<AgentPanelRef>(null);

  const mockService = useRef(
    new MockChatService(
      {
        onStatusChange: setStatus,
        onMessageAdd: (msg) => setMessages((prev) => [...prev, msg]),
        onMessageUpdate: (id, updates) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
          ),
        onThinkingStatusChange: setThinkingStatus,
        onError: setError,
      },
      {
        thinkingDelay: 1500,
        streamingWordDelay: 40,
        includeReasoning: true,
      }
    )
  ).current;

  const handleSend = useCallback(
    async (message: string) => {
      setError(null);
      await mockService.sendMessage(message);
    },
    [mockService]
  );

  const handleInterrupt = useCallback(() => {
    mockService.interrupt();
  }, [mockService]);

  const handleRetry = useCallback(async () => {
    setError(null);
    await mockService.retry();
  }, [mockService]);

  const mainMenu: MainMenuConfig = {
    appName: 'Agent Kit',
    appIcon: <Sparkles className="h-4 w-4" />,
    branding: {
      logo: <Sparkles className="h-5 w-5 text-primary" />,
      name: 'Agent Kit',
      tagline: 'Build AI-powered apps',
    },
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      avatarFallback: 'JD',
    },
    showThemeToggle: true,
    sections: [
      {
        id: 'main',
        items: [
          {
            id: 'home',
            label: 'Home',
            icon: <Home className="h-4 w-4" />,
            onClick: () => console.log('Home clicked'),
          },
          {
            id: 'projects',
            label: 'Projects',
            icon: <FileText className="h-4 w-4" />,
            onClick: () => console.log('Projects clicked'),
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => console.log('Settings clicked'),
          },
        ],
      },
    ],
    onSignOut: () => console.log('Sign out'),
  };

  const moreMenu: MoreMenuConfig = {
    items: [
      {
        id: 'feedback',
        label: 'Send feedback',
        onClick: () => console.log('Feedback'),
      },
      { id: 'help', label: 'Help & docs', onClick: () => console.log('Help') },
      {
        id: 'shortcuts',
        label: 'Keyboard shortcuts',
        onClick: () => console.log('Shortcuts'),
      },
    ],
  };

  const suggestions: SuggestionChip[] = [
    { id: '1', text: 'Create a landing page', prompt: 'Create a landing page' },
    { id: '2', text: 'Help me debug', prompt: 'Help me debug my code' },
    { id: '3', text: 'Explain this code', prompt: 'Explain this code' },
  ];

  const models = [
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic' as const,
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic' as const,
    },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' as const },
  ];

  const avatars = {
    assistant: { fallback: 'AI' },
    user: { fallback: 'U' },
  };

  return (
    <AppLayout
      mainMenu={mainMenu}
      moreMenu={moreMenu}
      headerSlots={{
        toolButtons: (
          <>
            <Tooltip content="Quick actions">
              <IconButton
                icon={<Zap className="h-4 w-4" />}
                label="Quick actions"
                variant="ghost"
                size="sm"
              />
            </Tooltip>
            <Tooltip content="Notifications">
              <IconButton
                icon={<Bell className="h-4 w-4" />}
                label="Notifications"
                variant="ghost"
                size="sm"
              />
            </Tooltip>
          </>
        ),
        navigation: (
          <div className="flex items-center gap-1">
            <Tooltip content="View and edit source code">
              <Button
                variant={activeTab === 'code' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('code')}
              >
                <Code className="h-4 w-4 mr-1.5" />
                Code
              </Button>
            </Tooltip>
            <Tooltip content="Preview your application">
              <Button
                variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('preview')}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
            </Tooltip>
          </div>
        ),
        status: (
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">Connected</span>
          </div>
        ),
        secondaryAction: (
          <Tooltip content="Share with collaborators">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-1.5" />
              Share
            </Button>
          </Tooltip>
        ),
        primaryAction: (
          <Tooltip content="Deploy to production">
            <Button size="sm">Deploy</Button>
          </Tooltip>
        ),
      }}
      panelConfig={{
        defaultWidth: 480,
        minWidth: 320,
        maxWidth: 700,
      }}
      assistantPanel={
        <AgentPanel
          ref={panelRef}
          messages={messages}
          status={status}
          error={error ?? undefined}
          thinkingStatus={thinkingStatus}
          suggestions={suggestions}
          emptyStateConfig={{
            title: 'How can I help?',
            description: 'Ask me to create, debug, or explain code',
          }}
          avatars={avatars}
          models={models}
          onSend={handleSend}
          onInterrupt={handleInterrupt}
          onRetry={handleRetry}
          onSuggestionClick={(s) => handleSend(s.prompt ?? s.text)}
        />
      }
    >
      {activeTab === 'code' ? (
        <div className="h-full overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Code Editor</h1>
            <div className="rounded-lg border border-border bg-card p-6 font-mono text-sm">
              <pre className="text-muted-foreground">
                {`// Your code goes here
function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
    </div>
  );
}

export default App;`}
              </pre>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              Try sending a message in the assistant panel. Commands like
              &quot;create file&quot;, &quot;search&quot;, or
              &quot;analyze&quot; will trigger different behaviors.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <LayoutDashboard className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Preview Mode</h2>
            <p className="text-muted-foreground">
              Your application preview will appear here
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export const FullFeatured: Story = {
  render: () => <FullFeaturedComponent />,
  parameters: {
    docs: {
      description: {
        story: `
Complete AppLayout with all features:
- Main menu with branding, profile, theme toggle, and navigation items
- Tool buttons and panel toggle
- Navigation tabs with active state
- Status indicator
- Share and Deploy action buttons
- More menu with additional actions
- Resizable assistant panel with AI chat
- Content area that switches based on active tab

**Try these commands in the chat:**
- \`create file\` - Triggers file creation tool
- \`search\` - Triggers web search tool
- \`analyze\` - Triggers multiple tools with reasoning
- \`error\` - Simulates API error
        `,
      },
    },
  },
};

// ============================================
// With Task History Sidebar
// ============================================

const mockTaskHistory: TaskHistoryItem[] = [
  {
    id: '1',
    title: 'Building a landing page',
    preview: 'Help me create a responsive landing page with...',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: '2',
    title: 'Debugging React hooks',
    preview: 'I have an issue with useEffect not cleaning up...',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    title: 'TypeScript generics',
    preview: 'Can you explain how to use conditional types...',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '4',
    title: 'API integration',
    preview: 'How do I properly handle errors with fetch...',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
];

const WithTaskHistoryComponent = () => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [tasks, setTasks] = useState<TaskHistoryItem[]>(mockTaskHistory);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status] = useState<TaskStatus>('ready');

  const mainMenu: MainMenuConfig = {
    appName: 'Agent Kit',
    appIcon: <Sparkles className="h-4 w-4" />,
    branding: {
      logo: <Sparkles className="h-5 w-5 text-primary" />,
      name: 'Agent Kit',
    },
    showThemeToggle: true,
    sections: [],
  };

  const models = [
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic' as const,
    },
  ];

  const avatars = {
    assistant: { fallback: 'AI' },
    user: { fallback: 'U' },
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    console.log('Selected task:', task?.title);
    // In a real app, you would load the messages for this task
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(undefined);
    }
  };

  const handleNewTask = () => {
    setSelectedTaskId(undefined);
    setMessages([]);
    console.log('Starting new task');
  };

  return (
    <>
      <AppLayout
        mainMenu={mainMenu}
        headerSlots={{
          toolButtons: (
            <Tooltip content="Task history">
              <IconButton
                icon={<History className="h-4 w-4" />}
                label="Task history"
                variant="ghost"
                size="sm"
                onClick={() => setHistoryOpen(true)}
              />
            </Tooltip>
          ),
        }}
        panelConfig={{
          defaultWidth: 400,
          minWidth: 280,
          maxWidth: 600,
        }}
        assistantPanel={
          <AgentPanel
            messages={messages}
            status={status}
            emptyStateConfig={{
              title: 'How can I help?',
              description: 'Start a new conversation or select from history',
            }}
            avatars={avatars}
            models={models}
            onSend={(msg) => console.log('Send:', msg)}
          />
        }
      >
        <div className="h-full flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">
              {selectedTaskId
                ? `Viewing: ${tasks.find((t) => t.id === selectedTaskId)?.title}`
                : 'No task selected'}
            </h2>
            <p className="text-muted-foreground">
              Click the history button in the header to view past tasks
            </p>
          </div>
        </div>
      </AppLayout>

      <TaskHistorySidebar
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onTaskSelect={handleTaskSelect}
        onTaskDelete={handleTaskDelete}
        onNewTask={handleNewTask}
      />
    </>
  );
};

export const WithTaskHistory: Story = {
  render: () => <WithTaskHistoryComponent />,
  parameters: {
    docs: {
      description: {
        story: `
AppLayout with task history sidebar integration.

**Features:**
- History button in the header (next to panel toggle)
- Clicking the button opens a left-side overlay panel
- Shows list of past tasks with timestamps
- Supports selecting, deleting, and creating new tasks
- Sidebar closes automatically when a task is selected
        `,
      },
    },
  },
};

// ============================================
// Fullscreen Page (No Assistant Panel)
// ============================================

const FullscreenPageComponent = () => {
  const mainMenu: MainMenuConfig = {
    appName: 'Agent Kit',
    appIcon: <Sparkles className="h-4 w-4" />,
    branding: {
      logo: <Sparkles className="h-5 w-5 text-primary" />,
      name: 'Agent Kit',
      tagline: 'Build AI-powered apps',
    },
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      avatarFallback: 'JD',
    },
    showThemeToggle: true,
    sections: [
      {
        id: 'navigation',
        items: [
          {
            id: 'agents',
            label: 'Agents',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: () => console.log('Navigate to Agents'),
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="h-4 w-4" />,
            onClick: () => console.log('Navigate to Analytics'),
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => console.log('Navigate to Settings'),
          },
        ],
      },
    ],
    onSignOut: () => console.log('Sign out'),
  };

  // Mock analytics data
  const stats = [
    { label: 'Total Tasks', value: '1,234', icon: MessageSquare },
    { label: 'Active Users', value: '56', icon: Users },
    { label: 'Avg. Response Time', value: '2.3s', icon: Clock },
    { label: 'Success Rate', value: '94.2%', icon: BarChart3 },
  ];

  return (
    <AppLayout mainMenu={mainMenu}>
      {/* Fullscreen content - no chat panel */}
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Overview of your organization&apos;s usage and performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm">
                    {stat.label}
                  </span>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Usage Over Time</h2>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export const FullscreenPage: Story = {
  render: () => <FullscreenPageComponent />,
  parameters: {
    docs: {
      description: {
        story: `
AppLayout without an assistant panel, suitable for admin pages like Settings or Analytics.

**Features:**
- Full header with main menu (app name, navigation items)
- No assistantPanel prop - content takes full width
- No panelConfig or panel toggle needed
- Clean, distraction-free layout for content-focused pages
- Navigation menu with links to Agents, Analytics, and Settings

**Use Cases:**
- Settings pages
- Analytics dashboards
- User management pages
- Any page that doesn't need the AI chat panel
        `,
      },
    },
  },
};

// ============================================
// Error Pages
// ============================================

const NotFoundPageComponent = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <Heading as="h1" size="24" className="mb-2">
          Page not found
        </Heading>
        <Text className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </Text>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => console.log('Navigate to dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => console.log('Go back')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: Story = {
  render: () => <NotFoundPageComponent />,
  parameters: {
    docs: {
      description: {
        story: `
A simple 404 Not Found page with a clean design.

**Features:**
- Centered layout with icon
- Clear messaging
- Navigation buttons to go back or to dashboard
        `,
      },
    },
  },
};

const ErrorPageComponent = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <Heading as="h1" size="24" className="mb-2">
          Something went wrong
        </Heading>
        <Text className="text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </Text>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => console.log('Refresh')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => console.log('Dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ErrorPage: Story = {
  render: () => <ErrorPageComponent />,
  parameters: {
    docs: {
      description: {
        story: `
A simple error page for displaying unexpected errors.

**Features:**
- Centered layout with warning icon
- Clear error messaging
- Retry and navigation buttons
        `,
      },
    },
  },
};
