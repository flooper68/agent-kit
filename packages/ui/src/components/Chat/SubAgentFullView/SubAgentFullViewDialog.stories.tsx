import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SubAgentFullViewDialog } from './SubAgentFullViewDialog';
import type { TaskMessage } from '../../../types/chat';
import { Button } from '../../Button';

// Helper to create messages
const createMessage = (
  id: string,
  role: 'user' | 'assistant',
  content: string
): TaskMessage => ({
  id,
  role,
  parts: [{ type: 'text', id: `${id}-text`, content }],
  createdAt: new Date(),
});

// Sample messages
const sampleMessages: TaskMessage[] = [
  createMessage('1', 'user', 'Can you research the latest trends in AI?'),
  createMessage(
    '2',
    'assistant',
    "I'll help you research the latest trends in AI. Let me search for recent developments and summarize the key findings.\n\n## Key Trends in AI (2024)\n\n1. **Large Language Models (LLMs)** - Continued advancement in model capabilities\n2. **Multimodal AI** - Integration of text, image, and audio processing\n3. **AI Agents** - Autonomous systems that can plan and execute tasks\n4. **Edge AI** - Running models locally on devices\n\nWould you like me to dive deeper into any of these areas?"
  ),
  createMessage('3', 'user', 'Tell me more about AI Agents'),
  createMessage(
    '4',
    'assistant',
    'AI Agents are autonomous systems designed to accomplish tasks by:\n\n- **Planning**: Breaking down complex goals into steps\n- **Tool Use**: Utilizing external APIs and services\n- **Memory**: Maintaining context across interactions\n- **Self-Correction**: Learning from mistakes\n\nThey represent a shift from passive chatbots to active assistants that can take real actions.'
  ),
];

// Long conversation for scroll testing
const longConversation: TaskMessage[] = Array.from({ length: 20 }, (_, i) => {
  const isUser = i % 2 === 0;
  return createMessage(
    `msg-${i}`,
    isUser ? 'user' : 'assistant',
    isUser
      ? `This is user message number ${Math.floor(i / 2) + 1}. Can you help me with this?`
      : `This is the assistant's response to message ${Math.floor(i / 2) + 1}. Here's some helpful information about your query. I'll provide detailed explanations and examples to make sure you understand the topic fully.`
  );
});

const meta: Meta<typeof SubAgentFullViewDialog> = {
  title: 'Chat/SubAgentFullView/SubAgentFullViewDialog',
  component: SubAgentFullViewDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'complete', 'error'],
    },
    isStreaming: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubAgentFullViewDialog>;

// Wrapper to provide dialog trigger
const DialogWrapper = (
  props: React.ComponentProps<typeof SubAgentFullViewDialog>
) => {
  const [open, setOpen] = useState(props.open);
  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <SubAgentFullViewDialog {...props} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export const Empty: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={[]}
      status="active"
      isStreaming={false}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const Streaming: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={sampleMessages.slice(0, 2)}
      status="active"
      isStreaming={true}
      usage={{ promptTokens: 500, completionTokens: 200 }}
      estimatedCost={0.01}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const Complete: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={sampleMessages}
      status="complete"
      isStreaming={false}
      usage={{ promptTokens: 1200, completionTokens: 800 }}
      estimatedCost={0.02}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const Error: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={sampleMessages.slice(0, 1)}
      status="error"
      isStreaming={false}
      usage={{ promptTokens: 300, completionTokens: 0 }}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const WithParent: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-2"
      title="Detail Extractor"
      messages={sampleMessages}
      status="complete"
      isStreaming={false}
      usage={{ promptTokens: 800, completionTokens: 400 }}
      estimatedCost={0.015}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
        { sessionId: 'session-2', title: 'Detail Extractor' },
      ]}
      parentSession={{ sessionId: 'session-1', title: 'Researcher Task' }}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const WithChildren: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={sampleMessages}
      status="complete"
      isStreaming={false}
      usage={{ promptTokens: 1500, completionTokens: 1000 }}
      estimatedCost={0.03}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      childSessions={[
        {
          sessionId: 'child-1',
          title: 'Detail Extractor',
          agentName: 'detail_extractor',
          status: 'complete',
        },
        {
          sessionId: 'child-2',
          title: 'Summarizer',
          agentName: 'summarizer',
          status: 'active',
        },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const WithParentAndChildren: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-2"
      title="Researcher"
      messages={sampleMessages}
      status="complete"
      isStreaming={false}
      usage={{ promptTokens: 2000, completionTokens: 1500 }}
      estimatedCost={0.04}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Coordinator' },
        { sessionId: 'session-2', title: 'Researcher' },
      ]}
      parentSession={{ sessionId: 'session-1', title: 'Coordinator Task' }}
      childSessions={[
        {
          sessionId: 'child-1',
          title: 'Detail Extractor',
          agentName: 'detail_extractor',
          status: 'complete',
        },
        {
          sessionId: 'child-2',
          title: 'Summarizer',
          agentName: 'summarizer',
          status: 'complete',
        },
        {
          sessionId: 'child-3',
          title: 'Validator',
          agentName: 'validator',
          status: 'error',
        },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
};

export const DeepNesting: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-5"
      title="Final Processor"
      messages={sampleMessages}
      status="active"
      isStreaming={true}
      usage={{ promptTokens: 500, completionTokens: 200 }}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Coordinator' },
        { sessionId: 'session-2', title: 'Researcher' },
        { sessionId: 'session-3', title: 'Analyzer' },
        { sessionId: 'session-4', title: 'Validator' },
        { sessionId: 'session-5', title: 'Final Processor' },
      ]}
      parentSession={{ sessionId: 'session-4', title: 'Validator' }}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '5 levels deep with breadcrumb truncation.',
      },
    },
  },
};

export const LongConversation: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-1"
      title="Researcher"
      messages={longConversation}
      status="complete"
      isStreaming={false}
      usage={{ promptTokens: 5000, completionTokens: 3000 }}
      estimatedCost={0.1}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
      ]}
      onNavigateToSession={(id) => console.log('Navigate to:', id)}
      canNavigateBack={true}
      onNavigateBack={() => console.log('Navigate back')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '20 messages to test scrolling behavior.',
      },
    },
  },
};

export const BackNavigation: Story = {
  render: () => (
    <DialogWrapper
      open={true}
      onOpenChange={() => {}}
      sessionId="session-2"
      title="Detail Extractor"
      messages={sampleMessages}
      status="complete"
      isStreaming={false}
      breadcrumbs={[
        { sessionId: 'root', title: 'Main Chat' },
        { sessionId: 'session-1', title: 'Researcher' },
        { sessionId: 'session-2', title: 'Detail Extractor' },
      ]}
      onNavigateToSession={(id) => alert(`Navigate to: ${id}`)}
      canNavigateBack={true}
      onNavigateBack={() => alert('Navigate back clicked')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click back arrow or breadcrumbs to trigger navigation.',
      },
    },
  },
};
