import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  AgentPanel,
  ConnectionSnackbar,
  SubAgentFullViewDialog,
} from '@agent-kit/ui';
import type {
  AgentType,
  TaskHistoryItem,
  SuggestionChip,
  ConnectionStatus,
  SessionResourcesCounts,
  RenderSubAgentCardProps,
} from '@agent-kit/ui';
import { MessageSquareText } from 'lucide-react';
import { useRegisterCommand } from '../contexts/CommandRegistryContext';
import { trpc, subscribeToConnectionState } from '../lib/trpc';
import { useAgentSession } from '../hooks/useAgentSession';
import { useClientToolCommands } from '../hooks/useClientToolCommands';
import { useSession } from '../contexts/SessionContext';
import { useSubAgentDialog } from '../hooks/useSubAgentDialog';
import { useSubAgentStreaming } from '../hooks/useSubAgentStreaming';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { SessionDetailModal } from './analytics/SessionDetailModal';
import { SessionResourcesDialog } from './SessionResourcesDialog';
import { SubAgentCardConnected } from './SubAgentCardConnected';

const STORAGE_KEY_AGENT = 'agent-kit:lastAgentId';

// Map WebSocket connection status to UI ConnectionStatus
const WS_TO_CONNECTION_STATUS_MAP: Record<string, ConnectionStatus> = {
  connecting: 'reconnecting',
  connected: 'connected',
  disconnected: 'disconnected',
  reconnecting: 'reconnecting',
};

interface AppAgentPanelProps {
  /** Available agents passed from parent */
  agents: AgentType[];
  /** Selected agent ID from parent (lifted state) */
  selectedAgentId?: string | null;
  /** Callback when agent is selected (lifted state) */
  onAgentSelect?: (agent: AgentType) => void;
  /** Callback when user wants to start a new chat */
  onNewChat?: () => void;
  /** Signal to focus the input (e.g., after agent selection from command palette) */
  pendingInputFocus?: boolean;
  /** Callback when input has been focused */
  onInputFocused?: () => void;
  emptyStateConfig?: {
    title?: string;
    description?: string;
  };
  suggestions?: Array<{ id: string; text: string }>;
  recentChats?: TaskHistoryItem[];
  onRecentChatClick?: (chat: TaskHistoryItem) => void;
  onRecentChatDelete?: (chat: TaskHistoryItem) => void;
  className?: string;
}

export function AppAgentPanel({
  agents,
  selectedAgentId,
  onAgentSelect,
  onNewChat,
  pendingInputFocus,
  onInputFocused,
  emptyStateConfig,
  suggestions,
  recentChats,
  onRecentChatClick,
  onRecentChatDelete,
  className,
}: AppAgentPanelProps) {
  const { sessionId, setSessionId, clearSession } = useSession();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useUser();
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  // Track WebSocket connection state for debugging snackbar
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('reconnecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // State for session inspect modal (can be main session or sub-agent session)
  const [inspectSessionId, setInspectSessionId] = useState<string | null>(null);

  // State for session resources dialog
  const [isResourcesDialogOpen, setIsResourcesDialogOpen] = useState(false);

  // Sub-agent dialog management
  const subAgentDialog = useSubAgentDialog(agents);

  // Sub-agent streaming (when dialog is open)
  const subAgentStreaming = useSubAgentStreaming({
    sessionId: subAgentDialog.currentSessionId,
    enabled: subAgentDialog.isOpen,
  });

  // Client tool commands handler (for navigateTo, getCurrentUIState, etc.)
  const { handleClientToolRequest } = useClientToolCommands({ sessionId });

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToConnectionState((state) => {
      if (!mounted) return;
      setConnectionStatus(
        WS_TO_CONNECTION_STATUS_MAP[state.status] ?? 'disconnected'
      );
      setReconnectAttempts(state.reconnectAttempts);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Create session mutation
  const createSessionMutation = trpc.sessions.create.useMutation();

  // Get tRPC utils for query invalidation
  const utils = trpc.useUtils();

  // Query for session resources (for the resources button)
  const resourcesQuery = trpc.sessions.getResources.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  // Compute resource counts for the button tooltip
  const sessionResourcesCounts: SessionResourcesCounts | undefined =
    useMemo(() => {
      if (!resourcesQuery.data) return undefined;
      const { artifacts, websites } = resourcesQuery.data;
      const artifactCount = artifacts.length;
      const websiteCount = websites.length;
      if (artifactCount === 0 && websiteCount === 0) return undefined;

      const previewTitles = [
        ...artifacts.slice(0, 2).map((a) => a.title),
        ...websites.slice(0, 2).map((w) => w.title),
      ].slice(0, 3);

      return { artifactCount, websiteCount, previewTitles };
    }, [resourcesQuery.data]);

  // Handle invalid persisted session
  const handleSessionInvalid = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Handle resource creation (artifacts, web search, extract content) - refetch resources to update the icon
  const handleResourceCreated = useCallback(() => {
    if (sessionId) {
      utils.sessions.getResources.invalidate({ sessionId });
    }
    // Also invalidate artifacts list so ArtifactsPage updates when artifacts are created via tool calls
    utils.artifacts.list.invalidate();
  }, [sessionId, utils.sessions.getResources, utils.artifacts.list]);

  // Use the agent session hook
  const {
    setMessageListRef,
    messages,
    status,
    sendMessage,
    interrupt,
    error,
    retry,
    dismissError,
    contextUsage,
    handleScrollPositionChange,
    showScrollButton,
    sessionAgentId,
    todos,
    streamingStartTime,
  } = useAgentSession({
    sessionId,
    onSessionInvalid: handleSessionInvalid,
    onResourceCreated: handleResourceCreated,
    onClientToolRequest: handleClientToolRequest,
  });

  // Convert streamingStartTime to formatted elapsed label for main session
  const { formattedElapsed: elapsedLabel } = useElapsedTime({
    startTime: streamingStartTime,
    isRunning: status === 'streaming',
  });

  // Convert streamingStartTime to formatted elapsed label for sub-agent dialog
  const { formattedElapsed: subAgentElapsedLabel } = useElapsedTime({
    startTime: subAgentStreaming.streamingStartTime,
    isRunning: subAgentStreaming.isStreaming,
  });

  // Track when selectedAgentId changes from parent (command palette selection)
  const prevSelectedAgentIdRef = useRef(selectedAgentId);
  useEffect(() => {
    // Sync when parent's selectedAgentId changes
    if (
      selectedAgentId &&
      selectedAgentId !== prevSelectedAgentIdRef.current &&
      agents.length > 0
    ) {
      const agent = agents.find((a) => a.id === selectedAgentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
    prevSelectedAgentIdRef.current = selectedAgentId;
  }, [selectedAgentId, agents]);

  // Initialize selected agent from localStorage or fallback to first agent
  useEffect(() => {
    if (selectedAgent || sessionId || agents.length === 0) return;

    // Try to restore from localStorage first
    try {
      const savedAgentId = localStorage.getItem(STORAGE_KEY_AGENT);
      if (savedAgentId) {
        const savedAgent = agents.find((a) => a.id === savedAgentId);
        if (savedAgent) {
          setSelectedAgent(savedAgent);
          return;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    // Fallback to first agent
    const firstAgent = agents[0];
    if (firstAgent) {
      setSelectedAgent(firstAgent);
    }
  }, [sessionId, selectedAgent, agents]);

  // Restore agent from session data (e.g., after page refresh)
  useEffect(() => {
    if (sessionAgentId && agents.length > 0) {
      const sessionAgent = agents.find((a) => a.id === sessionAgentId);
      if (sessionAgent && sessionAgent.id !== selectedAgent?.id) {
        setSelectedAgent(sessionAgent);
      }
    }
  }, [sessionAgentId, agents, selectedAgent?.id]);

  // Focus input when pendingInputFocus is set (e.g., after agent selection from command palette)
  useEffect(() => {
    if (pendingInputFocus && inputRef.current) {
      // Small delay to ensure panel is rendered/expanded
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        onInputFocused?.();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingInputFocus, onInputFocused]);

  // Create avatars config from logged-in user
  const avatars = useMemo(
    () => ({
      user: {
        src: user?.imageUrl,
        fallback: user?.fullName?.charAt(0).toUpperCase() ?? 'U',
        name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress,
      },
      assistant: {
        fallback: 'AI',
        name: 'Assistant',
      },
    }),
    [user]
  );

  // Create avatars config for sub-agent dialog (shows parent agent as "user" for spawned sessions)
  const subAgentAvatars = useMemo(() => {
    if (
      subAgentDialog.spawnDepth &&
      subAgentDialog.spawnDepth > 0 &&
      subAgentDialog.parentAgent
    ) {
      return {
        user: {
          fallback:
            subAgentDialog.parentAgent.name?.charAt(0).toUpperCase() ?? 'A',
          name: subAgentDialog.parentAgent.name ?? 'Agent',
        },
        assistant: {
          fallback: 'AI',
          name: 'Assistant',
        },
      };
    }
    return undefined;
  }, [subAgentDialog.spawnDepth, subAgentDialog.parentAgent]);

  // Handle agent selection - session is created on first message, not here
  const handleAgentSelect = useCallback(
    (agent: AgentType) => {
      setSelectedAgent(agent);
      onAgentSelect?.(agent);
      try {
        localStorage.setItem(STORAGE_KEY_AGENT, agent.id);
      } catch {
        // Ignore localStorage errors
      }
    },
    [onAgentSelect]
  );

  const handleSend = useCallback(
    async (message: string) => {
      let currentSessionId = sessionId;

      // If no session yet, create one with the selected agent (or first agent as fallback)
      if (!currentSessionId) {
        // Guard against concurrent session creation (e.g., double-click)
        if (createSessionMutation.isPending) {
          return;
        }

        const agentToUse = selectedAgent || agents[0];
        if (agentToUse) {
          try {
            const session = await createSessionMutation.mutateAsync({
              agentId: agentToUse.id,
              isLocalAgent: agentToUse.isLocal ?? false,
            });
            if (session) {
              currentSessionId = session.id;
              setSelectedAgent(agentToUse);
              // Persist the agent ID to localStorage
              try {
                localStorage.setItem(STORAGE_KEY_AGENT, agentToUse.id);
              } catch {
                // Ignore localStorage errors
              }
              // Set the session ID in global context
              setSessionId(session.id);
            }
          } catch (error) {
            console.error('Failed to create session:', error);
            return;
          }
        }
      }

      if (currentSessionId) {
        // Pass sessionId explicitly in case state hasn't updated yet
        await sendMessage(message, currentSessionId);
      }
    },
    [
      sessionId,
      selectedAgent,
      agents,
      createSessionMutation,
      sendMessage,
      setSessionId,
    ]
  );

  const handleInterrupt = useCallback(() => {
    interrupt();
  }, [interrupt]);

  const handleRetry = useCallback(() => {
    retry();
  }, [retry]);

  const handleErrorDismiss = useCallback(() => {
    dismissError();
  }, [dismissError]);

  const handleSuggestionClick = useCallback(
    (suggestion: SuggestionChip) => {
      handleSend(suggestion.text);
    },
    [handleSend]
  );

  const handleInspect = useCallback(() => {
    if (sessionId) {
      setInspectSessionId(sessionId);
    }
  }, [sessionId]);

  const handleInspectClose = useCallback(() => {
    setInspectSessionId(null);
  }, []);

  // Inspect handler for sub-agent sessions
  const handleSubAgentInspect = useCallback(() => {
    if (subAgentDialog.currentSessionId) {
      setInspectSessionId(subAgentDialog.currentSessionId);
    }
  }, [subAgentDialog.currentSessionId]);

  const handleSessionResources = useCallback(() => {
    setIsResourcesDialogOpen(true);
  }, []);

  const handleResourcesClose = useCallback(() => {
    setIsResourcesDialogOpen(false);
  }, []);

  // Callback for opening sub-agent dialog
  const handleOpenSubAgentDialog = useCallback(
    (subAgentSessionId: string) => {
      subAgentDialog.openDialog(subAgentSessionId);
    },
    [subAgentDialog]
  );

  // Render function for sub-agent cards (enables real-time streaming)
  const renderSubAgentCard = useCallback((props: RenderSubAgentCardProps) => {
    return (
      <SubAgentCardConnected
        sessionId={props.sessionId}
        agentName={props.agentName}
        toolState={props.toolState}
        toolResult={props.toolResult}
        onOpenFullView={props.onOpenFullView}
        onOpenSubAgentDialog={props.onOpenSubAgentDialog}
      />
    );
  }, []);

  // Register focus input command
  // Note: onSelect is a no-op because getFocusTarget handles the focus behavior.
  // The CommandPalette will focus the returned element after closing.
  const focusInputCommand = useMemo(
    () => ({
      id: 'focus-chat-input',
      label: 'Focus chat input',
      description: 'Move cursor to the chat input field',
      icon: <MessageSquareText className="h-4 w-4" />,
      keywords: ['focus', 'input', 'chat', 'type', 'message'],
      onSelect: () => {},
      getFocusTarget: () => inputRef.current,
    }),
    []
  );

  useRegisterCommand(focusInputCommand);

  // Callback ref for input
  const handleInputRef = useCallback((node: HTMLTextAreaElement | null) => {
    inputRef.current = node;
  }, []);

  return (
    <div className="relative h-full">
      <AgentPanel
        className={className}
        scrollContainerRef={setMessageListRef}
        inputRef={handleInputRef}
        messages={messages}
        status={status}
        avatars={avatars}
        agents={agents}
        selectedAgent={selectedAgent || undefined}
        isAgentSelectorDisabled={!!sessionId}
        contextUsage={contextUsage ?? undefined}
        emptyStateConfig={emptyStateConfig}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        recentChats={recentChats}
        error={error ?? undefined}
        onSend={handleSend}
        onInterrupt={handleInterrupt}
        onAgentSelect={handleAgentSelect}
        onRecentChatClick={onRecentChatClick}
        onRecentChatDelete={onRecentChatDelete}
        onCreateNewTask={onNewChat}
        onRetry={handleRetry}
        onErrorDismiss={handleErrorDismiss}
        onScrollPositionChange={handleScrollPositionChange}
        showScrollButton={showScrollButton}
        onInspect={sessionId ? handleInspect : undefined}
        onSessionResources={sessionId ? handleSessionResources : undefined}
        sessionResourcesCounts={sessionResourcesCounts}
        todos={todos}
        elapsedLabel={elapsedLabel}
        onOpenSubAgentDialog={handleOpenSubAgentDialog}
        renderSubAgentCard={renderSubAgentCard}
      />
      <ConnectionSnackbar
        status={connectionStatus}
        reconnectAttempt={reconnectAttempts}
      />
      <SessionDetailModal
        sessionId={inspectSessionId}
        onClose={handleInspectClose}
      />
      <SessionResourcesDialog
        sessionId={isResourcesDialogOpen ? sessionId : null}
        onClose={handleResourcesClose}
      />
      <SubAgentFullViewDialog
        open={subAgentDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) subAgentDialog.closeDialog();
        }}
        agentName={subAgentDialog.sessionData.agentName}
        messages={subAgentStreaming.messages}
        status={
          subAgentStreaming.status === 'idle'
            ? 'active'
            : subAgentStreaming.status
        }
        isStreaming={subAgentStreaming.isStreaming}
        usage={subAgentDialog.sessionData.usage}
        todos={subAgentStreaming.todos}
        agent={subAgentDialog.agent}
        elapsedLabel={subAgentElapsedLabel}
        onInspect={handleSubAgentInspect}
        onOpenSubAgentDialog={subAgentDialog.navigateTo}
        renderSubAgentCard={renderSubAgentCard}
        avatars={subAgentAvatars}
      />
    </div>
  );
}
