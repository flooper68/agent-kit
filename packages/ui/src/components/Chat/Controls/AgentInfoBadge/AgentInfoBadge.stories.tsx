import type { Meta, StoryObj } from '@storybook/react';
import { Bot, Code, FileText, Sparkles } from 'lucide-react';
import { AgentInfoBadge } from './AgentInfoBadge';
import type { AgentType } from '../../../../types/chat';

const meta: Meta<typeof AgentInfoBadge> = {
  title: 'Chat/Controls/AgentInfoBadge',
  component: AgentInfoBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AgentInfoBadge>;

const generalAgent: AgentType = {
  id: 'general',
  name: 'General Assistant',
  description:
    'A versatile AI assistant that can help with everyday tasks, answer questions, and provide information on a wide range of topics.',
  icon: <Bot className="h-5 w-5" />,
};

const codeAgent: AgentType = {
  id: 'code',
  name: 'Code Expert',
  description:
    'Specialized in programming, debugging, and software development. Can help with code reviews, explain algorithms, and assist with best practices.',
  icon: <Code className="h-5 w-5" />,
};

const writerAgent: AgentType = {
  id: 'writer',
  name: 'Writing Assistant',
  description:
    'Helps with content creation, editing, and improving written communication. Great for drafting emails, articles, and documentation.',
  icon: <FileText className="h-5 w-5" />,
};

const creativeAgent: AgentType = {
  id: 'creative',
  name: 'Creative Partner',
  description:
    'Supports brainstorming, ideation, and creative projects. Perfect for generating ideas and exploring possibilities.',
  icon: <Sparkles className="h-5 w-5" />,
};

const agentWithoutIcon: AgentType = {
  id: 'minimal',
  name: 'Minimal Agent',
  description: 'An agent without an icon.',
};

const agentWithoutDescription: AgentType = {
  id: 'nodesc',
  name: 'No Description Agent',
  icon: <Bot className="h-5 w-5" />,
};

export const Default: Story = {
  args: {
    agent: generalAgent,
  },
};

export const CodeExpert: Story = {
  args: {
    agent: codeAgent,
  },
};

export const WritingAssistant: Story = {
  args: {
    agent: writerAgent,
  },
};

export const CreativePartner: Story = {
  args: {
    agent: creativeAgent,
  },
};

export const WithoutIcon: Story = {
  args: {
    agent: agentWithoutIcon,
  },
};

export const WithoutDescription: Story = {
  args: {
    agent: agentWithoutDescription,
  },
};

export const AllAgents: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <AgentInfoBadge agent={generalAgent} />
      <AgentInfoBadge agent={codeAgent} />
      <AgentInfoBadge agent={writerAgent} />
      <AgentInfoBadge agent={creativeAgent} />
    </div>
  ),
};
