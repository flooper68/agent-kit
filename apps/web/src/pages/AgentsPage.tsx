import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUrlState } from '../hooks/useUrlState';
import {
  Heading,
  Text,
  Button,
  Dialog,
  Select,
  Input,
  useToast,
  Tabs,
} from '@agent-kit/ui';
import {
  Plus,
  Bot,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Cable,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { ExternalAgentCard } from '../components/external-agents/ExternalAgentCard';
import { PROVIDER_CONFIG } from '../components/agents';

// Card component for server agents (Agent Builder created)
function ServerAgentCard({
  agent,
  isLoading,
  onEdit,
  onToggleDisabled,
  onToggleFavorite,
  onDelete,
}: {
  agent: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    provider: string;
    model: string;
    disabled: boolean;
    isFavorite: boolean;
    systemPrompt: string;
    tools: string[];
    temperature: number | null;
    maxOutputTokens: number | null;
    thinkingConfig: unknown;
  };
  isLoading: boolean;
  onEdit: () => void;
  onToggleDisabled: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  // Reuse the ExternalAgentCard but without secret key, status, and ID display
  return (
    <ExternalAgentCard
      id={agent.id}
      name={agent.name}
      description={agent.description}
      secretKeyPrefix=""
      provider={agent.provider}
      model={agent.model}
      isFavorite={agent.isFavorite}
      disabled={agent.disabled}
      isLoading={isLoading}
      onEdit={onEdit}
      onRegenerateKey={() => {}}
      onToggleDisabled={onToggleDisabled}
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      hideSecretKey
      hideStatus
      hideId
    />
  );
}

type TabValue = 'agents' | 'local';
const validTabs: TabValue[] = ['agents', 'local'];

type AgentsStatusFilter = 'all' | 'enabled' | 'disabled' | 'favorites';
type LocalStatusFilter = 'all' | 'enabled' | 'disabled';

export function AgentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActions, clearActions } = useHeaderActions();

  // Get tab from URL, default to 'agents'
  const [activeTab, setActiveTab] = useUrlState<TabValue>('tab', {
    defaultValue: 'agents',
    parse: (v) =>
      v && validTabs.includes(v as TabValue) ? (v as TabValue) : 'agents',
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabValue);
  };
  const [regenerateTarget, setRegenerateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    agentType: 'external' | 'server';
  } | null>(null);

  // Agents tab filters (URL persisted)
  const [agentsStatusFilter, setAgentsStatusFilter] =
    useUrlState<AgentsStatusFilter>('status', {
      defaultValue: 'enabled',
      parse: (v) =>
        v && ['all', 'enabled', 'disabled', 'favorites'].includes(v)
          ? (v as AgentsStatusFilter)
          : 'enabled',
    });
  const [agentsProviderFilter, setAgentsProviderFilter] = useUrlState(
    'provider',
    { defaultValue: 'all' }
  );
  const [searchQuery, setSearchQuery] = useUrlState('search', {
    debounceMs: 300,
  });

  // Local agents tab filters (URL persisted)
  const [localStatusFilter, setLocalStatusFilter] =
    useUrlState<LocalStatusFilter>('localStatus', {
      defaultValue: 'enabled',
      parse: (v) =>
        v && ['all', 'enabled', 'disabled'].includes(v)
          ? (v as LocalStatusFilter)
          : 'enabled',
    });

  // Track loading state for individual agent operations
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null);
  // Show secret key after create/regenerate (only time it's visible)
  const [revealedSecretKey, setRevealedSecretKey] = useState<{
    key: string;
    agentName: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const hasAutoCopied = useRef(false);
  const { addToast } = useToast();
  // Track connection status for external agents
  const [connectionStatus, setConnectionStatus] = useState<
    Map<string, boolean>
  >(new Map());

  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Agents | Agent Kit';
  }, []);

  // Set header action based on active tab
  useEffect(() => {
    if (activeTab === 'agents') {
      setActions([
        {
          id: 'create-agent',
          label: 'Create Agent',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => navigate('/app/agents/new'),
        },
      ]);
    } else if (activeTab === 'local') {
      setActions([
        {
          id: 'create-local-agent',
          label: 'Create External Agent',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => navigate('/app/agents/new/external'),
        },
      ]);
    } else {
      clearActions();
    }
    return () => clearActions();
  }, [setActions, clearActions, activeTab, navigate]);

  // Handle incoming navigation state (secret key reveal from create page)
  useEffect(() => {
    const state = location.state as {
      revealSecretKey?: { key: string; agentName: string };
      activeTab?: 'agents' | 'local';
    } | null;
    if (state?.revealSecretKey) {
      setRevealedSecretKey(state.revealSecretKey);
      // Clear state to prevent showing again on refresh
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [
    location.state,
    location.pathname,
    location.search,
    navigate,
    setActiveTab,
  ]);

  // Queries
  const serverAgentsQuery = trpc.agents.listServer.useQuery();
  const externalAgentsQuery = trpc.agents.listExternal.useQuery();

  // Subscribe to connection status updates for external agents
  trpc.agents.externalConnectionStatus.useSubscription(undefined, {
    onData: (update) => {
      setConnectionStatus((prev) => {
        const next = new Map(prev);
        next.set(update.agentId, update.status === 'connected');
        return next;
      });
    },
    onError: (err) => {
      console.error('Connection status subscription error:', err);
    },
  });

  // Auto-copy secret key to clipboard when dialog opens
  useEffect(() => {
    if (revealedSecretKey && !hasAutoCopied.current) {
      hasAutoCopied.current = true;
      navigator.clipboard.writeText(revealedSecretKey.key).then(
        () => {
          setCopiedKey(true);
          addToast({
            message: 'Secret key copied to clipboard',
            variant: 'success',
          });
          setTimeout(() => setCopiedKey(false), 2000);
        },
        () => {
          // Clipboard access failed - user can still copy manually
        }
      );
    }
    if (!revealedSecretKey) {
      hasAutoCopied.current = false;
    }
  }, [revealedSecretKey, addToast]);

  // Filter server agents (Agent Builder created)
  const filteredServerAgents = useMemo(() => {
    if (!serverAgentsQuery.data) return [];
    let agents = serverAgentsQuery.data;

    // Apply status filter
    switch (agentsStatusFilter) {
      case 'enabled':
        agents = agents.filter((agent) => !agent.disabled);
        break;
      case 'disabled':
        agents = agents.filter((agent) => agent.disabled);
        break;
      case 'favorites':
        agents = agents.filter((agent) => agent.isFavorite);
        break;
    }

    // Apply provider filter
    if (agentsProviderFilter !== 'all') {
      agents = agents.filter(
        (agent) => agent.provider === agentsProviderFilter
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      agents = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.key.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then alphabetically
    return agents.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [
    serverAgentsQuery.data,
    agentsStatusFilter,
    agentsProviderFilter,
    searchQuery,
  ]);

  // Filter external agents
  const filteredExternalAgents = useMemo(() => {
    if (!externalAgentsQuery.data) return [];
    let agents = externalAgentsQuery.data;

    switch (localStatusFilter) {
      case 'enabled':
        agents = agents.filter((agent) => !agent.disabled);
        break;
      case 'disabled':
        agents = agents.filter((agent) => agent.disabled);
        break;
    }

    return agents;
  }, [externalAgentsQuery.data, localStatusFilter]);

  // Count for filter badges
  const serverAgentCounts = useMemo(() => {
    if (!serverAgentsQuery.data)
      return { all: 0, enabled: 0, disabled: 0, favorites: 0 };
    return {
      all: serverAgentsQuery.data.length,
      enabled: serverAgentsQuery.data.filter((a) => !a.disabled).length,
      disabled: serverAgentsQuery.data.filter((a) => a.disabled).length,
      favorites: serverAgentsQuery.data.filter((a) => a.isFavorite).length,
    };
  }, [serverAgentsQuery.data]);

  const externalAgentCounts = useMemo(() => {
    if (!externalAgentsQuery.data) return { all: 0, enabled: 0, disabled: 0 };
    return {
      all: externalAgentsQuery.data.length,
      enabled: externalAgentsQuery.data.filter((a) => !a.disabled).length,
      disabled: externalAgentsQuery.data.filter((a) => a.disabled).length,
    };
  }, [externalAgentsQuery.data]);

  // Get unique providers
  const uniqueProviders = useMemo(() => {
    const providers = new Set<string>();
    serverAgentsQuery.data?.forEach((a) => providers.add(a.provider));
    return Array.from(providers).sort();
  }, [serverAgentsQuery.data]);

  // Mutations
  const setDisabledMutation = trpc.agents.setDisabled.useMutation({
    onSuccess: () => {
      setLoadingAgentId(null);
      utils.agents.listServer.invalidate();
      utils.agents.listExternal.invalidate();
      utils.agents.list.invalidate();
    },
    onError: () => {
      setLoadingAgentId(null);
    },
  });

  const regenerateKeyMutation = trpc.agents.regenerateKey.useMutation({
    onSuccess: (data) => {
      const agentName = regenerateTarget?.name ?? 'Agent';
      setRegenerateTarget(null);
      setLoadingAgentId(null);
      setRevealedSecretKey({
        key: data.secretKey,
        agentName,
      });
      utils.agents.listExternal.invalidate();
    },
    onError: () => {
      setLoadingAgentId(null);
    },
  });

  const toggleFavoriteMutation = trpc.agents.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.agents.listServer.invalidate();
    },
  });

  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      // Use queueMicrotask to ensure Radix UI Dialog can properly clean up
      // before we unmount the dialog by clearing deleteTarget
      queueMicrotask(() => {
        setDeleteTarget(null);
      });
      addToast({ message: 'Agent deleted successfully', variant: 'success' });
      utils.agents.listServer.invalidate();
      utils.agents.listExternal.invalidate();
      utils.agents.list.invalidate();
    },
    onError: (err) => {
      addToast({ message: err.message, variant: 'error' });
      queueMicrotask(() => {
        setDeleteTarget(null);
      });
    },
  });

  // Handlers
  const handleToggleFavorite = (
    id: string,
    currentFavorite: boolean,
    agentType: 'external' | 'server'
  ) => {
    toggleFavoriteMutation.mutate({
      id,
      isFavorite: !currentFavorite,
      agentType,
    });
  };

  const handleToggleDisabled = (
    id: string,
    currentDisabled: boolean,
    agentType: 'external' | 'server'
  ) => {
    setLoadingAgentId(id);
    setDisabledMutation.mutate({ id, disabled: !currentDisabled, agentType });
  };

  const handleDelete = (
    id: string,
    name: string,
    agentType: 'external' | 'server'
  ) => {
    setDeleteTarget({ id, name, agentType });
  };

  const handleCopyKey = useCallback(async () => {
    if (!revealedSecretKey) return;
    try {
      await navigator.clipboard.writeText(revealedSecretKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Clipboard access failed
    }
  }, [revealedSecretKey]);

  const handleCloseSecretKeyDialog = () => {
    setRevealedSecretKey(null);
    setCopiedKey(false);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Heading as="h1" size="24">
            Agents
          </Heading>
          <Text className="text-muted-foreground">
            Create server agents or connect external agents
          </Text>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Trigger value="agents">
              <Bot className="mr-1 h-4 w-4" />
              Server Agents
            </Tabs.Trigger>
            <Tabs.Trigger value="local">
              <Cable className="mr-1 h-4 w-4" />
              External Agents
            </Tabs.Trigger>
          </Tabs.List>

          {/* Agents Tab - Server agents + Built-in agents */}
          <Tabs.Content value="agents">
            {/* Filter Bar */}
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={agentsStatusFilter}
                  onValueChange={(value) =>
                    setAgentsStatusFilter(
                      value as 'all' | 'enabled' | 'disabled' | 'favorites'
                    )
                  }
                  options={[
                    { value: 'all', label: `All (${serverAgentCounts.all})` },
                    {
                      value: 'enabled',
                      label: `Enabled (${serverAgentCounts.enabled})`,
                    },
                    {
                      value: 'disabled',
                      label: `Disabled (${serverAgentCounts.disabled})`,
                    },
                    {
                      value: 'favorites',
                      label: `Favorites (${serverAgentCounts.favorites})`,
                    },
                  ]}
                  className="w-44"
                />
                {uniqueProviders.length > 1 && (
                  <Select
                    value={agentsProviderFilter}
                    onValueChange={setAgentsProviderFilter}
                    options={[
                      { value: 'all', label: 'All providers' },
                      ...uniqueProviders.map((p) => ({
                        value: p,
                        label: PROVIDER_CONFIG[p]?.label ?? p,
                        icon: PROVIDER_CONFIG[p]?.icon,
                      })),
                    ]}
                    className="w-44"
                  />
                )}
              </div>
            </div>

            {/* Loading State */}
            {serverAgentsQuery.isLoading && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            )}

            {/* Agent Cards */}
            {filteredServerAgents.length > 0 && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {filteredServerAgents.map((agent) => (
                  <ServerAgentCard
                    key={agent.id}
                    agent={agent}
                    isLoading={loadingAgentId === agent.id}
                    onEdit={() => navigate(`/app/agents/${agent.id}/edit`)}
                    onToggleDisabled={() =>
                      handleToggleDisabled(agent.id, agent.disabled, 'server')
                    }
                    onToggleFavorite={() =>
                      handleToggleFavorite(agent.id, agent.isFavorite, 'server')
                    }
                    onDelete={() =>
                      handleDelete(agent.id, agent.name, 'server')
                    }
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!serverAgentsQuery.isLoading &&
              filteredServerAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">No agents found</Text>
                  <Text className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Create your first custom agent'}
                  </Text>
                </div>
              )}
          </Tabs.Content>

          {/* External Agents Tab - External WebSocket agents */}
          <Tabs.Content value="local">
            {/* Filter Bar */}
            {externalAgentsQuery.data &&
              externalAgentsQuery.data.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <Select
                    value={localStatusFilter}
                    onValueChange={(value) =>
                      setLocalStatusFilter(
                        value as 'all' | 'enabled' | 'disabled'
                      )
                    }
                    options={[
                      {
                        value: 'all',
                        label: `All (${externalAgentCounts.all})`,
                      },
                      {
                        value: 'enabled',
                        label: `Enabled (${externalAgentCounts.enabled})`,
                      },
                      {
                        value: 'disabled',
                        label: `Disabled (${externalAgentCounts.disabled})`,
                      },
                    ]}
                    className="w-44"
                  />
                </div>
              )}

            {/* Loading State */}
            {externalAgentsQuery.isLoading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {externalAgentsQuery.data &&
              externalAgentsQuery.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Cable className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">No external agents yet</Text>
                  <Text className="text-sm text-muted-foreground">
                    Create an external agent to connect external processes via
                    WebSocket
                  </Text>
                </div>
              )}

            {/* Empty State - No agents matching filter */}
            {externalAgentsQuery.data &&
              externalAgentsQuery.data.length > 0 &&
              filteredExternalAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Cable className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">
                    No{' '}
                    {localStatusFilter === 'enabled' ? 'enabled' : 'disabled'}{' '}
                    agents
                  </Text>
                </div>
              )}

            {/* External Agent Cards Grid */}
            {filteredExternalAgents.length > 0 && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {filteredExternalAgents.map((agent) => (
                  <ExternalAgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    secretKeyPrefix={agent.secretKeyPrefix}
                    isFavorite={agent.isFavorite}
                    disabled={agent.disabled}
                    isConnected={connectionStatus.get(agent.key)}
                    isLoading={loadingAgentId === agent.id}
                    onEdit={() => navigate(`/app/agents/${agent.id}/edit`)}
                    onRegenerateKey={() =>
                      setRegenerateTarget({ id: agent.id, name: agent.name })
                    }
                    onToggleDisabled={() =>
                      handleToggleDisabled(agent.id, agent.disabled, 'external')
                    }
                    onToggleFavorite={() =>
                      handleToggleFavorite(
                        agent.id,
                        agent.isFavorite,
                        'external'
                      )
                    }
                    onDelete={() =>
                      handleDelete(agent.id, agent.name, 'external')
                    }
                  />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs>
      </div>

      {/* Regenerate Key Confirmation Dialog */}
      <Dialog
        open={!!regenerateTarget}
        onOpenChange={(open) => !open && setRegenerateTarget(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Regenerate Secret Key</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to regenerate the secret key for &ldquo;
              {regenerateTarget?.name}&rdquo;? The current key will be
              invalidated immediately.
            </Dialog.Description>
          </Dialog.Header>
          <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/50 p-3 my-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <Text className="text-sm text-yellow-600 dark:text-yellow-400">
              Any services using the current key will stop working.
            </Text>
          </div>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => setRegenerateTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                regenerateTarget &&
                regenerateKeyMutation.mutate({ id: regenerateTarget.id })
              }
              isLoading={regenerateKeyMutation.isPending}
            >
              Regenerate Key
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Delete Agent</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/50 p-3 my-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <Text className="text-sm text-destructive">
              The agent will be permanently removed from all lists and cannot be
              recovered.
            </Text>
          </div>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget &&
                deleteMutation.mutate({
                  id: deleteTarget.id,
                  agentType: deleteTarget.agentType,
                })
              }
              isLoading={deleteMutation.isPending}
            >
              Delete Agent
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      {/* Secret Key Reveal Dialog */}
      <Dialog
        open={!!revealedSecretKey}
        onOpenChange={(open) => !open && handleCloseSecretKeyDialog()}
      >
        <Dialog.Content size="md">
          <Dialog.Header>
            <Dialog.Title>Secret Key Created</Dialog.Title>
            <Dialog.Description>
              Save this secret key for &ldquo;{revealedSecretKey?.agentName}
              &rdquo;. You won&apos;t be able to see it again.
            </Dialog.Description>
          </Dialog.Header>
          <div className="my-4">
            <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/50 p-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <Text className="text-sm text-yellow-600 dark:text-yellow-400">
                This is the only time this key will be shown. Copy it now and
                store it securely.
              </Text>
            </div>
            <div className="relative">
              <Input
                type="password"
                value={revealedSecretKey?.key ?? ''}
                readOnly
                className="w-full font-mono text-sm pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyKey}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Dialog.Footer>
            <Button onClick={handleCloseSecretKeyDialog}>Done</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
