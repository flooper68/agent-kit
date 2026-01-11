import { Text, ScopesCheckboxList, type ScopeOption } from '@agent-kit/ui';
import type { AgentFormData } from '../types';
import { trpc } from '../../../lib/trpc';

interface PermissionsSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  onBlur?: () => void;
}

export function PermissionsSection({
  formData,
  onChange,
  onBlur,
}: PermissionsSectionProps) {
  const scopesQuery = trpc.agents.listScopes.useQuery();

  const handleScopesChange = (selectedScopes: string[]) => {
    onChange({ scopes: selectedScopes });
    onBlur?.();
  };

  if (scopesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text className="text-muted-foreground">Loading permissions...</Text>
      </div>
    );
  }

  const scopes: ScopeOption[] =
    scopesQuery.data?.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
      category: s.category,
    })) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <Text className="text-sm font-medium">Permissions</Text>
        <Text className="text-xs text-muted-foreground">
          Control which capabilities this agent can access. Sensible defaults
          are pre-selected for new agents.
        </Text>
      </div>

      <ScopesCheckboxList
        scopes={scopes}
        selectedScopes={formData.scopes}
        onChange={handleScopesChange}
      />

      <div className="p-3 border rounded-lg bg-muted/30">
        <Text className="text-xs text-muted-foreground">
          <strong>Note:</strong> Permissions control which actions the agent can
          perform. For example, without &quot;Write Artifacts&quot; permission,
          the agent cannot create or modify documents.
        </Text>
      </div>
    </div>
  );
}
