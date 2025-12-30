import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { Button } from '../../Button';
import type { ChatHistoryItem } from '../../../types/chat';

const createChat = (
  id: string,
  title: string,
  daysAgo: number,
  preview?: string
): ChatHistoryItem => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    title,
    preview,
    createdAt: date,
    updatedAt: date,
  };
};

const sampleChats: ChatHistoryItem[] = [
  createChat(
    '1',
    'Help with React hooks',
    0,
    'Can you explain useEffect cleanup functions?'
  ),
  createChat(
    '2',
    'TypeScript generics',
    1,
    'I need help understanding generic constraints'
  ),
  createChat(
    '3',
    'API design patterns',
    2,
    'What are best practices for REST API design?'
  ),
  createChat(
    '4',
    'Database optimization',
    5,
    'How can I improve my PostgreSQL query performance?'
  ),
  createChat(
    '5',
    'Testing strategies',
    8,
    'What testing approach should I use for a React app?'
  ),
];

const meta: Meta<typeof ChatHistorySidebar> = {
  title: 'Chat/ChatHistorySidebar',
  component: ChatHistorySidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChatHistorySidebar>;

// Interactive wrapper
const SidebarWrapper = ({
  chats = sampleChats,
  selectedChatId,
}: {
  chats?: ChatHistoryItem[];
  selectedChatId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(selectedChatId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Chat History</Button>
      <ChatHistorySidebar
        open={open}
        onOpenChange={setOpen}
        chats={chats}
        selectedChatId={selected}
        onChatSelect={(id) => {
          setSelected(id);
          console.log('Selected:', id);
        }}
        onChatDelete={(id) => console.log('Delete:', id)}
        onNewChat={() => console.log('New chat')}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <SidebarWrapper />,
};

export const WithSelection: Story = {
  render: () => <SidebarWrapper selectedChatId="2" />,
};

export const Empty: Story = {
  render: () => <SidebarWrapper chats={[]} />,
};

export const ManyChats: Story = {
  render: () => (
    <SidebarWrapper
      chats={Array.from({ length: 20 }, (_, i) =>
        createChat(
          `chat-${i + 1}`,
          `Chat conversation ${i + 1}`,
          i,
          `This is a preview of chat ${i + 1} with some sample content...`
        )
      )}
    />
  ),
};

export const LongTitles: Story = {
  render: () => (
    <SidebarWrapper
      chats={[
        createChat(
          '1',
          'This is a very long chat title that should be truncated properly',
          0,
          'Preview text'
        ),
        createChat(
          '2',
          'Another extremely long title for a chat conversation',
          1,
          'More preview text here'
        ),
      ]}
    />
  ),
};
