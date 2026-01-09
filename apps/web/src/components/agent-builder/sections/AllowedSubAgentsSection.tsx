import { useMemo, useRef, useEffect } from 'react';
import { Text, MultiSelectChips, type MultiSelectOption } from '@agent-kit/ui';
import { trpc } from '../../../lib/trpc';
import type { AgentFormData, AllowedSubagents } from '../types';

interface AllowedSubAgentsSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  /** Current agent ID (to exclude from selection when editing) */
  currentAgentId?: string;
  onBlur?: () => void;
}

export function AllowedSubAgentsSection({
  formData,
  onChange,
  currentAgentId,
  onBlur,
}: AllowedSubAgentsSectionProps) {
  // Fetch both server and external agents
  const serverAgents = trpc.agents.listServer.useQuery();
  const externalAgents = trpc.agents.listExternal.useQuery();

  const isLoading = serverAgents.isLoading || externalAgents.isLoading;

  // Build lookup maps for categorizing selections
  const serverAgentIds = useMemo(() => {
    return new Set((serverAgents.data ?? []).map((a) => a.id));
  }, [serverAgents.data]);

  const externalAgentIds = useMemo(() => {
    return new Set((externalAgents.data ?? []).map((a) => a.id));
  }, [externalAgents.data]);

  // Use ref to track latest onBlur callback to avoid stale closure issues
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  // Combine and transform agents to MultiSelectOption format (using IDs as values)
  const agentOptions: MultiSelectOption[] = useMemo(() => {
    const server = (serverAgents.data ?? [])
      .filter((a) => !a.disabled && a.id !== currentAgentId)
      .map((a) => ({
        value: a.id, // Use ID instead of key
        label: a.name,
        description: a.description ?? undefined,
        badge: 'Server',
        badgeVariant: 'default' as const,
      }));

    const external = (externalAgents.data ?? [])
      .filter((a) => !a.disabled && a.id !== currentAgentId)
      .map((a) => ({
        value: a.id, // Use ID instead of key
        label: a.name,
        description: a.description ?? undefined,
        badge: 'External',
        badgeVariant: 'secondary' as const,
      }));

    return [...server, ...external];
  }, [serverAgents.data, externalAgents.data, currentAgentId]);

  // Convert AllowedSubagents to flat array of IDs for MultiSelectChips
  const selectedIds = useMemo(() => {
    const ids: string[] = [];
    if (formData.allowedSubagents.serverAgentIds) {
      ids.push(...formData.allowedSubagents.serverAgentIds);
    }
    if (formData.allowedSubagents.externalAgentIds) {
      ids.push(...formData.allowedSubagents.externalAgentIds);
    }
    return ids;
  }, [formData.allowedSubagents]);

  // Handle selection changes - categorize IDs back into server/external
  const handleChange = (values: string[]) => {
    const newAllowedSubagents: AllowedSubagents = {
      serverAgentIds: values.filter((id) => serverAgentIds.has(id)),
      externalAgentIds: values.filter((id) => externalAgentIds.has(id)),
    };
    onChange({ allowedSubagents: newAllowedSubagents });
    // Defer onBlur to next frame so React can process state update first
    // Use ref to call latest callback, avoiding stale closure issues
    requestAnimationFrame(() => onBlurRef.current?.());
  };

  return (
    <div className="space-y-4">
      <div>
        <Text className="text-sm font-medium">Allowed Sub-Agents</Text>
        <Text className="text-xs text-muted-foreground mt-1">
          Select which agents this agent is allowed to spawn. If none are
          selected, this agent cannot spawn any sub-agents.
        </Text>
      </div>

      <MultiSelectChips
        value={selectedIds}
        onChange={handleChange}
        options={agentOptions}
        placeholder="Search agents..."
        addLabel="Add Agent"
        isLoading={isLoading}
        onBlur={onBlur}
      />

      <div className="p-3 border rounded-lg bg-muted/30">
        <Text className="text-xs text-muted-foreground">
          <strong>Note:</strong> This is an allowlist - the agent can{' '}
          <strong>only</strong> spawn agents that are explicitly added here.
          Make sure to also enable the &quot;Spawn Agent&quot; tool in the Tools
          section.
        </Text>
      </div>
    </div>
  );
}
