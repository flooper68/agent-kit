import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AgentSelector } from './AgentSelector';
import type { AgentType } from '../../../../types/chat';

const basicAgents: AgentType[] = [
  {
    id: 'assistant-gpt-4o',
    name: 'Assistant - GPT-4o',
    description: 'Multimodal model with vision capabilities',
    model: 'gpt-4o',
    provider: 'openai',
  },
  {
    id: 'assistant-gemini-3-flash',
    name: 'Assistant - Gemini 3 Flash',
    description: 'Fast and efficient Google assistant',
    model: 'gemini-3-flash',
    provider: 'gemini',
  },
  {
    id: 'assistant-haiku-4.5',
    name: 'Assistant - Haiku 4.5',
    description: 'Fast and efficient for quick tasks',
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
  },
];

const manyAgents: AgentType[] = [
  // OpenAI Models
  {
    id: 'assistant-gpt-5.2',
    name: 'Assistant - GPT-5.2',
    description: 'Most capable OpenAI model with advanced reasoning',
    model: 'gpt-5.2',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-5.2-codex',
    name: 'Assistant - GPT-5.2 Codex',
    description: 'Specialized for code generation and analysis',
    model: 'gpt-5.2-codex',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-5',
    name: 'Assistant - GPT-5',
    description: 'Powerful OpenAI model for complex tasks',
    model: 'gpt-5',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-5-mini',
    name: 'Assistant - GPT-5 Mini',
    description: 'Balanced performance and cost efficiency',
    model: 'gpt-5-mini',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-5-nano',
    name: 'Assistant - GPT-5 Nano',
    description: 'Ultra-fast and cost-effective for simple tasks',
    model: 'gpt-5-nano',
    provider: 'openai',
  },
  {
    id: 'assistant-o3',
    name: 'Assistant - o3',
    description: 'OpenAI reasoning model for complex problem solving',
    model: 'o3',
    provider: 'openai',
  },
  {
    id: 'assistant-o4-mini',
    name: 'Assistant - o4-mini',
    description: 'Compact reasoning model for efficient analysis',
    model: 'o4-mini',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-4o',
    name: 'Assistant - GPT-4o',
    description: 'Multimodal model with vision capabilities',
    model: 'gpt-4o',
    provider: 'openai',
  },
  {
    id: 'assistant-gpt-4o-mini',
    name: 'Assistant - GPT-4o Mini',
    description: 'Fast and affordable multimodal assistant',
    model: 'gpt-4o-mini',
    provider: 'openai',
  },
  // Anthropic Models
  {
    id: 'assistant-opus-4.5',
    name: 'Assistant - Opus 4.5',
    description: 'Most capable Anthropic model for complex tasks',
    model: 'claude-opus-4-5-20251101',
    provider: 'anthropic',
  },
  {
    id: 'assistant-sonnet-4.5',
    name: 'Assistant - Sonnet 4.5',
    description: 'Balanced performance and intelligence',
    model: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
  },
  {
    id: 'assistant-haiku-4.5',
    name: 'Assistant - Haiku 4.5',
    description: 'Fast and efficient for quick tasks',
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
  },
  {
    id: 'assistant-opus-4.1',
    name: 'Assistant - Opus 4.1',
    description: 'Premium Anthropic model for demanding tasks',
    model: 'claude-opus-4-1-20250805',
    provider: 'anthropic',
  },
  {
    id: 'assistant-sonnet-4',
    name: 'Assistant - Sonnet 4',
    description: 'Reliable performance for everyday tasks',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
  },
  {
    id: 'assistant-haiku-3.5',
    name: 'Assistant - Haiku 3.5',
    description: 'Quick and affordable assistant',
    model: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
  },
  // Google Gemini Models
  {
    id: 'assistant-gemini-3-pro',
    name: 'Assistant - Gemini 3 Pro',
    description: 'Most capable Google model for complex reasoning',
    model: 'gemini-3-pro',
    provider: 'gemini',
  },
  {
    id: 'assistant-gemini-3-flash',
    name: 'Assistant - Gemini 3 Flash',
    description: 'Fast and efficient Google assistant',
    model: 'gemini-3-flash',
    provider: 'gemini',
  },
  {
    id: 'assistant-gemini-2.5-pro',
    name: 'Assistant - Gemini 2.5 Pro',
    description: 'Powerful model for advanced tasks',
    model: 'gemini-2.5-pro',
    provider: 'gemini',
  },
  {
    id: 'assistant-gemini-2.5-flash',
    name: 'Assistant - Gemini 2.5 Flash',
    description: 'Quick responses for everyday use',
    model: 'gemini-2.5-flash',
    provider: 'gemini',
  },
  {
    id: 'assistant-gemini-2.5-flash-lite',
    name: 'Assistant - Gemini 2.5 Flash-Lite',
    description: 'Ultra-lightweight and cost-effective',
    model: 'gemini-2.5-flash-lite',
    provider: 'gemini',
  },
  {
    id: 'assistant-gemini-2.0-flash',
    name: 'Assistant - Gemini 2.0 Flash',
    description: 'Fast legacy model for simple tasks',
    model: 'gemini-2.0-flash',
    provider: 'gemini',
  },
];

const meta: Meta<typeof AgentSelector> = {
  title: 'Chat/Chat Components/AgentSelector',
  component: AgentSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSelect: { action: 'selected' },
  },
  decorators: [
    (Story) => (
      <div className="pt-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentSelector>;

export const Default: Story = {
  args: {
    agents: basicAgents,
    selectedAgent: basicAgents[0],
  },
};

export const WithManyAgents: Story = {
  args: {
    agents: manyAgents,
    selectedAgent: manyAgents[0],
  },
};

export const NoAgentSelected: Story = {
  args: {
    agents: basicAgents,
    placeholder: 'Select an agent',
  },
};

export const Disabled: Story = {
  args: {
    agents: basicAgents,
    selectedAgent: basicAgents[0],
    disabled: true,
  },
};

export const EmptyAgentList: Story = {
  args: {
    agents: [],
    placeholder: 'No agents available',
  },
};

const InteractiveComponent = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | undefined>(
    manyAgents[0]
  );
  return (
    <AgentSelector
      agents={manyAgents}
      selectedAgent={selectedAgent}
      onSelect={setSelectedAgent}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveComponent />,
};

const SearchFilteringComponent = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | undefined>(
    undefined
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Try searching for: &quot;opus&quot;, &quot;flash&quot;,
        &quot;openai&quot;, &quot;anthropic&quot;, or &quot;gemini&quot;
      </p>
      <AgentSelector
        agents={manyAgents}
        selectedAgent={selectedAgent}
        onSelect={setSelectedAgent}
        placeholder="Search and select..."
      />
    </div>
  );
};

export const SearchFiltering: Story = {
  render: () => <SearchFilteringComponent />,
};
