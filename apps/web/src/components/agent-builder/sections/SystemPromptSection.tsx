import { Text, Textarea } from '@agent-kit/ui';
import type { AgentFormData } from '../types';

interface SystemPromptSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  onBlur?: () => void;
}

export function SystemPromptSection({
  formData,
  onChange,
  onBlur,
}: SystemPromptSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">System Prompt</label>
        <Textarea
          value={formData.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          onBlur={onBlur}
          placeholder="You are a helpful AI assistant..."
          rows={20}
          className="font-mono text-sm"
        />
        <Text className="text-xs text-muted-foreground">
          Instructions that define your agent&apos;s behavior, personality, and
          capabilities. This prompt is sent at the start of every conversation.
        </Text>
      </div>

      <div className="p-4 border rounded-lg bg-muted/30">
        <Text className="text-sm font-medium mb-2">
          Tips for writing system prompts:
        </Text>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Be specific about the agent&apos;s role and expertise</li>
          <li>Define the tone and communication style</li>
          <li>Specify what the agent should and shouldn&apos;t do</li>
          <li>Include any domain-specific knowledge or context</li>
          <li>Keep it focused - longer prompts use more tokens</li>
        </ul>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Characters: {formData.systemPrompt.length}</span>
        <span>~{Math.ceil(formData.systemPrompt.length / 4)} tokens</span>
      </div>
    </div>
  );
}
