import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Wrench,
  Search,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { LocalAgentCard } from '../components/local-agents/LocalAgentCard';
import {
  LocalAgentDialog,
  type LocalAgentFormData,
} from '../components/local-agents/LocalAgentDialog';
import { BuiltInAgentCard, PROVIDER_CONFIG } from '../components/agents';

export function AgentsPage() {
  const { setActions, clearActions } = useHeaderActions();
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<{
    id: string;
    data: LocalAgentFormData;
  } | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('enabled');
  // Built-in agents filters
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
  // Track connection status for all agents
  const [connectionStatus, setConnectionStatus] = useState<
    Map<string, boolean>
  >(new Map());

  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = 'Agents | Agent Kit';
  }, []);

  // Set header action - only show on Custom Agents tab
  useEffect(() => {
    if (activeTab === 'custom') {
      setActions([
        {
          id: 'create-agent',
          label: 'Create Agent',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setIsCreateDialogOpen(true),
        },
      ]);
    } else {
      clearActions();
    }
    return () => clearActions();
  }, [setActions, clearActions, activeTab]);

  const localAgentsQuery = trpc.localAgents.list.useQuery();
  const builtInAgentsQuery = trpc.agents.listBuiltIn.useQuery();

  // Subscribe to connection status updates
  trpc.localAgents.connectionStatus.useSubscription(undefined, {
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

  // Clear error when dialogs open
  useEffect(() => {
    if (isCreateDialogOpen) {
      setError(null);
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (editingAgent) {
      setError(null);
    }
  }, [editingAgent]);

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

  // Filter agents based on status filter
  const filteredAgents = useMemo(() => {
    if (!localAgentsQuery.data) return [];
    switch (statusFilter) {
      case 'enabled':
        return localAgentsQuery.data.filter((agent) => !agent.disabled);
      case 'disabled':
        return localAgentsQuery.data.filter((agent) => agent.disabled);
      default:
        return localAgentsQuery.data;
    }
  }, [localAgentsQuery.data, statusFilter]);

  // Count for filter badges
  const agentCounts = useMemo(() => {
    if (!localAgentsQuery.data) return { all: 0, enabled: 0, disabled: 0 };
    return {
      all: localAgentsQuery.data.length,
      enabled: localAgentsQuery.data.filter((a) => !a.disabled).length,
      disabled: localAgentsQuery.data.filter((a) => a.disabled).length,
    };
  }, [localAgentsQuery.data]);

  // Get unique providers from built-in agents
  const uniqueProviders = useMemo(() => {
    if (!builtInAgentsQuery.data) return [];
    const providers = new Set(builtInAgentsQuery.data.map((a) => a.provider));
    return Array.from(providers).sort();
  }, [builtInAgentsQuery.data]);

  // Filter built-in agents based on provider and search
  const filteredBuiltInAgents = useMemo(() => {
    if (!builtInAgentsQuery.data) return [];
    return builtInAgentsQuery.data.filter((agent) => {
      // Provider filter
      if (providerFilter !== 'all' && agent.provider !== providerFilter) {
        return false;
      }
      // Search filter (name or id)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(query);
        const matchesId = agent.id.toLowerCase().includes(query);
        if (!matchesName && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [builtInAgentsQuery.data, providerFilter, searchQuery]);

  const createMutation = trpc.localAgents.create.useMutation({
    onSuccess: (data) => {
      setIsCreateDialogOpen(false);
      setError(null);
      // Show the secret key (only time it's available)
      setRevealedSecretKey({
        key: data.secretKey,
        agentName: data.agent.name,
      });
      utils.localAgents.list.invalidate();
      utils.agents.list.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateMutation = trpc.localAgents.update.useMutation({
    onSuccess: () => {
      setEditingAgent(null);
      setError(null);
      utils.localAgents.list.invalidate();
      utils.agents.list.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const setDisabledMutation = trpc.localAgents.setDisabled.useMutation({
    onSuccess: () => {
      setLoadingAgentId(null);
      utils.localAgents.list.invalidate();
      utils.agents.list.invalidate();
    },
    onError: () => {
      setLoadingAgentId(null);
    },
  });

  const regenerateKeyMutation = trpc.localAgents.regenerateKey.useMutation({
    onSuccess: (data) => {
      const agentName = regenerateTarget?.name ?? 'Agent';
      setRegenerateTarget(null);
      setLoadingAgentId(null);
      // Show the new secret key (only time it's available)
      setRevealedSecretKey({
        key: data.secretKey,
        agentName,
      });
      utils.localAgents.list.invalidate();
    },
    onError: () => {
      setLoadingAgentId(null);
    },
  });

  const handleCreate = (data: LocalAgentFormData) => {
    createMutation.mutate({
      key: data.key,
      name: data.name,
      description: data.description || undefined,
    });
  };

  const handleUpdate = (data: LocalAgentFormData) => {
    if (!editingAgent) return;
    updateMutation.mutate({
      id: editingAgent.id,
      key: data.key,
      name: data.name,
      description: data.description || undefined,
    });
  };

  const handleToggleDisabled = (id: string, currentDisabled: boolean) => {
    setLoadingAgentId(id);
    setDisabledMutation.mutate({ id, disabled: !currentDisabled });
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

  const handleCloseCreateDialog = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false);
      setError(null);
    }
  };

  const handleCloseEditDialog = (open: boolean) => {
    if (!open) {
      setEditingAgent(null);
      setError(null);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Heading as="h1" size="24">
              Agents
            </Heading>
            <Text className="text-muted-foreground">
              Explore built-in agents or manage your custom agents
            </Text>
          </div>

          {/* Status Filter - only show on Custom Agents tab */}
          {activeTab === 'custom' &&
            localAgentsQuery.data &&
            localAgentsQuery.data.length > 0 && (
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as 'all' | 'enabled' | 'disabled')
                }
                options={[
                  { value: 'all', label: `All (${agentCounts.all})` },
                  {
                    value: 'enabled',
                    label: `Enabled (${agentCounts.enabled})`,
                  },
                  {
                    value: 'disabled',
                    label: `Disabled (${agentCounts.disabled})`,
                  },
                ]}
                className="w-40"
              />
            )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'built-in' | 'custom')}
        >
          <Tabs.List>
            <Tabs.Trigger value="built-in">
              <Bot className="mr-1 h-4 w-4" />
              Agents
            </Tabs.Trigger>
            <Tabs.Trigger value="custom">
              <Wrench className="mr-1 h-4 w-4" />
              Custom Agents
            </Tabs.Trigger>
          </Tabs.List>

          {/* Built-in Agents Tab */}
          <Tabs.Content value="built-in">
            {/* Filter Bar */}
            {builtInAgentsQuery.data && builtInAgentsQuery.data.length > 0 && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <Select
                  value={providerFilter}
                  onValueChange={setProviderFilter}
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
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {builtInAgentsQuery.isLoading && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            )}

            {/* Agents Grid */}
            {filteredBuiltInAgents.length > 0 && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {filteredBuiltInAgents.map((agent) => (
                  <BuiltInAgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    model={agent.model}
                    provider={agent.provider}
                    systemPrompt={agent.systemPrompt}
                    tools={agent.tools}
                  />
                ))}
              </div>
            )}

            {/* Empty State - No built-in agents at all */}
            {builtInAgentsQuery.data &&
              builtInAgentsQuery.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">No built-in agents</Text>
                  <Text className="text-sm text-muted-foreground">
                    No built-in agents are available
                  </Text>
                </div>
              )}

            {/* Empty State - No matching agents */}
            {builtInAgentsQuery.data &&
              builtInAgentsQuery.data.length > 0 &&
              filteredBuiltInAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">No matching agents</Text>
                  <Text className="text-sm text-muted-foreground">
                    Try adjusting your search or filter
                  </Text>
                </div>
              )}
          </Tabs.Content>

          {/* Custom Agents Tab */}
          <Tabs.Content value="custom">
            {/* Loading State */}
            {localAgentsQuery.isLoading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            )}

            {/* Empty State - No agents at all */}
            {localAgentsQuery.data && localAgentsQuery.data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                <Text className="font-medium">No custom agents yet</Text>
                <Text className="text-sm text-muted-foreground">
                  Create your first custom agent to get started
                </Text>
              </div>
            )}

            {/* Empty State - No agents matching filter */}
            {localAgentsQuery.data &&
              localAgentsQuery.data.length > 0 &&
              filteredAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                  <Text className="font-medium">
                    No {statusFilter === 'enabled' ? 'enabled' : 'disabled'}{' '}
                    agents
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {statusFilter === 'enabled'
                      ? 'All your agents are currently disabled'
                      : 'All your agents are currently enabled'}
                  </Text>
                </div>
              )}

            {/* Agent Cards Grid */}
            {filteredAgents.length > 0 && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {filteredAgents.map((agent) => (
                  <LocalAgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    secretKeyPrefix={agent.secretKeyPrefix}
                    disabled={agent.disabled}
                    isConnected={connectionStatus.get(agent.key)}
                    isLoading={loadingAgentId === agent.id}
                    onEdit={() =>
                      setEditingAgent({
                        id: agent.id,
                        data: {
                          key: agent.key,
                          name: agent.name,
                          description: agent.description ?? '',
                        },
                      })
                    }
                    onRegenerateKey={() =>
                      setRegenerateTarget({ id: agent.id, name: agent.name })
                    }
                    onToggleDisabled={() =>
                      handleToggleDisabled(agent.id, agent.disabled)
                    }
                  />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <LocalAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={handleCloseCreateDialog}
        mode="create"
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        error={error}
      />

      {/* Edit Dialog */}
      <LocalAgentDialog
        open={!!editingAgent}
        onOpenChange={handleCloseEditDialog}
        mode="edit"
        initialData={editingAgent?.data}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        error={error}
      />

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
