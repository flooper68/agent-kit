import type { Meta, StoryObj } from '@storybook/react';
import { RecentChats } from './RecentChats';
import type { TaskHistoryItem } from '../../../../types/chat';

const createChat = (
  id: string,
  title: string,
  options: {
    preview?: string;
    daysAgo?: number;
    isPrivate?: boolean;
    userName?: string;
    avatarColor?: string;
    agentName?: string;
  } = {}
): TaskHistoryItem => {
  const {
    preview,
    daysAgo = 0,
    isPrivate,
    userName,
    avatarColor,
    agentName,
  } = options;
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id,
    title,
    preview,
    createdAt: date,
    updatedAt: date,
    isPrivate,
    user: userName
      ? {
          id: `user-${id}`,
          name: userName,
          avatarColor,
        }
      : undefined,
    agentName,
  };
};

const meta: Meta<typeof RecentChats> = {
  title: 'Chat/Chat Components/RecentChats',
  component: RecentChats,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[768px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecentChats>;

export const Default: Story = {
  args: {
    chats: [
      createChat('1', 'Chat interface tweaks', {
        preview: "Let's start tweaking the chat interface",
        daysAgo: 12,
        isPrivate: true,
        userName: 'flooper68',
        avatarColor: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
        agentName: 'configurator-copilot',
      }),
      createChat('2', 'API endpoint refactoring', {
        preview: 'Restructuring the REST endpoints for v2',
        daysAgo: 5,
        userName: 'devuser42',
        avatarColor: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        agentName: 'code-assistant',
      }),
      createChat('3', 'Documentation updates', {
        preview: 'Adding examples to the getting started guide',
        daysAgo: 2,
        userName: 'docwriter',
        avatarColor: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      }),
      createChat('4', 'Database migration', {
        preview: 'Migrating from SQLite to PostgreSQL',
        daysAgo: 1,
        userName: 'dbadmin',
        avatarColor: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        agentName: 'migration-helper',
      }),
    ],
    onChatClick: (chat) => console.log('Clicked:', chat),
    onDeleteClick: (chat) => console.log('Delete clicked:', chat),
  },
};

export const WithPrivateChats: Story = {
  args: {
    chats: [
      createChat('1', 'Private project setup', {
        preview: 'Setting up the new confidential project',
        daysAgo: 1,
        isPrivate: true,
        userName: 'admin',
        avatarColor: '#6366f1',
        agentName: 'project-manager',
      }),
      createChat('2', 'Public discussion', {
        preview: 'Open conversation about features',
        daysAgo: 3,
        userName: 'contributor',
        avatarColor: '#10b981',
      }),
    ],
    onChatClick: (chat) => console.log('Clicked:', chat),
    onDeleteClick: (chat) => console.log('Delete clicked:', chat),
  },
};

export const MinimalData: Story = {
  args: {
    chats: [
      createChat('1', 'Quick question', {
        daysAgo: 0,
      }),
      createChat('2', 'Another chat', {
        preview: 'With just a preview',
        daysAgo: 7,
      }),
    ],
    onChatClick: (chat) => console.log('Clicked:', chat),
  },
};

export const SingleChat: Story = {
  args: {
    chats: [
      createChat('1', 'My first conversation', {
        preview: 'Getting started with the app',
        daysAgo: 0,
        userName: 'newuser',
        avatarColor: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        agentName: 'onboarding-bot',
      }),
    ],
    onChatClick: (chat) => console.log('Clicked:', chat),
    onDeleteClick: (chat) => console.log('Delete clicked:', chat),
  },
};

export const Empty: Story = {
  args: {
    chats: [],
  },
};
