import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AgentPanel, ConnectionSnackbar } from '@agent-kit/ui';
import type {
  AgentType,
  TaskHistoryItem,
  SuggestionChip,
  ConnectionStatus,
  SessionResourcesCounts,
} from '@agent-kit/ui';
import { MessageSquareText } from 'lucide-react';
import { useRegisterCommand } from '../contexts/CommandRegistryContext';
import { trpc, subscribeToConnectionState } from '../lib/trpc';
import { useAgentSession } from '../hooks/useAgentSession';
import { useClientToolCommands } from '../hooks/useClientToolCommands';
import { useSession } from '../contexts/SessionContext';
import { SessionDetailModal } from './analytics/SessionDetailModal';
import { SessionResourcesDialog } from './SessionResourcesDialog';

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
  /** Callback when user wants to start a new chat */
  onNewChat?: () => void;
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
  onNewChat,
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

  // State for session inspect modal
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // State for session resources dialog
  const [isResourcesDialogOpen, setIsResourcesDialogOpen] = useState(false);

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
    sessionAgentId,
  } = useAgentSession({
    sessionId,
    onSessionInvalid: handleSessionInvalid,
    onResourceCreated: handleResourceCreated,
    onClientToolRequest: handleClientToolRequest,
  });

  // Restore last selected agent from localStorage, or fallback to first agent
  useEffect(() => {
    if (!sessionId && !selectedAgent && agents.length > 0) {
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

  // Handle agent selection - session is created on first message, not here
  const handleAgentSelect = useCallback((agent: AgentType) => {
    setSelectedAgent(agent);
    try {
      localStorage.setItem(STORAGE_KEY_AGENT, agent.id);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

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
    setIsInspectModalOpen(true);
  }, []);

  const handleInspectClose = useCallback(() => {
    setIsInspectModalOpen(false);
  }, []);

  const handleSessionResources = useCallback(() => {
    setIsResourcesDialogOpen(true);
  }, []);

  const handleResourcesClose = useCallback(() => {
    setIsResourcesDialogOpen(false);
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
        onInspect={sessionId ? handleInspect : undefined}
        onSessionResources={sessionId ? handleSessionResources : undefined}
        sessionResourcesCounts={sessionResourcesCounts}
      />
      <ConnectionSnackbar
        status={connectionStatus}
        reconnectAttempt={reconnectAttempts}
      />
      <SessionDetailModal
        sessionId={isInspectModalOpen ? sessionId : null}
        onClose={handleInspectClose}
      />
      <SessionResourcesDialog
        sessionId={isResourcesDialogOpen ? sessionId : null}
        onClose={handleResourcesClose}
      />
    </div>
  );
}
