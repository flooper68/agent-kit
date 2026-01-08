import { Input, Text, Textarea } from '@agent-kit/ui';
import type { AgentFormData } from '../types';

interface IdentitySectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  mode: 'create' | 'edit';
  onBlur?: () => void;
}

export function IdentitySection({
  formData,
  onChange,
  mode,
  onBlur,
}: IdentitySectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Key</label>
        <Input
          value={formData.key}
          onChange={(e) => onChange({ key: e.target.value })}
          placeholder="my-agent"
          required
          pattern="^[a-zA-Z0-9_-]+$"
          title="Key can only contain letters, numbers, underscores, and hyphens"
          disabled={mode === 'edit'}
        />
        <Text className="text-xs text-muted-foreground">
          Unique identifier used for spawning. Letters, numbers, underscores,
          and hyphens only.
          {mode === 'edit' && ' Cannot be changed after creation.'}
        </Text>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={onBlur}
          placeholder="My Custom Agent"
          required
        />
        <Text className="text-xs text-muted-foreground">
          Display name shown in the UI.
        </Text>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          onBlur={onBlur}
          placeholder="A helpful assistant for..."
          rows={3}
        />
        <Text className="text-xs text-muted-foreground">
          Brief description of what this agent does.
        </Text>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isFavorite"
          checked={formData.isFavorite}
          onChange={(e) => {
            onChange({ isFavorite: e.target.checked });
            onBlur?.();
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isFavorite" className="text-sm">
          Mark as favorite (appears at top of agent list)
        </label>
      </div>
    </div>
  );
}
