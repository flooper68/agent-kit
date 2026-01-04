import type {
  TaskMessage,
  TaskStatus,
  SuggestionChip,
  ContextUsage,
  AgentType,
  TaskHistoryItem,
} from '../../../types/chat';
import type { SessionResourcesCounts } from '../Controls/SessionResourcesButton';

/**
 * Error information for the task
 */
export interface TaskError {
  type: 'api' | 'network' | 'rate_limit' | 'stream_interrupted' | 'tool_error';
  message: string;
  retryable: boolean;
  details?: unknown;
}

/**
 * Configuration for the empty state display
 */
export interface EmptyStateConfig {
  title?: string;
  description?: string;
}

/**
 * Configuration for avatar display
 */
export interface AvatarConfig {
  user?: {
    src?: string;
    fallback?: string;
    /** Full name or email to show in tooltip */
    name?: string;
  };
  assistant?: {
    src?: string;
    fallback?: string;
    /** Name to show in tooltip */
    name?: string;
  };
}

/**
 * Callbacks for AgentPanel events
 */
export interface AgentPanelCallbacks {
  /** Called when user sends a message */
  onSend: (message: string, attachments?: File[]) => void | Promise<void>;

  /** Called when user interrupts generation */
  onInterrupt?: () => void;

  /** Called when user clicks retry on an error */
  onRetry?: (messageId?: string) => void;

  /** Called when user clicks a suggestion chip */
  onSuggestionClick?: (suggestion: SuggestionChip) => void;

  /** Called when user requests message regeneration */
  onRegenerate?: (messageId: string) => void;

  /** Called when an error banner is dismissed */
  onErrorDismiss?: () => void;

  /** Called when files are attached */
  onAttach?: (files: File[]) => void;

  /** Called when an agent type is selected */
  onAgentSelect?: (agent: AgentType) => void;

  /** Called when a task is selected from the task selector */
  onTaskSelect?: (taskId: string) => void;

  /** Called when user wants to create a new task */
  onCreateNewTask?: () => void;

  /** Called when a recent chat is clicked in the empty state */
  onRecentChatClick?: (chat: TaskHistoryItem) => void;

  /** Called when a recent chat is deleted in the empty state */
  onRecentChatDelete?: (chat: TaskHistoryItem) => void;

  /** Called when user clicks the inspect button to view session details */
  onInspect?: () => void;

  /** Called when user clicks the session resources button */
  onSessionResources?: () => void;
}

/**
 * Main AgentPanel component props
 */
export interface AgentPanelProps extends AgentPanelCallbacks {
  /** Array of task messages to display */
  messages: TaskMessage[];

  /** Current status of the task */
  status: TaskStatus;

  /** Error information if status is 'error' */
  error?: TaskError | null;

  /** Configuration for suggestions in empty state */
  suggestions?: SuggestionChip[];

  /** Configuration for the empty state */
  emptyStateConfig?: EmptyStateConfig;

  /** Avatar configuration for user and assistant */
  avatars?: AvatarConfig;

  /** Whether attachments are enabled */
  enableAttachments?: boolean;

  /** Whether regenerate button is shown on assistant messages */
  enableRegenerate?: boolean;

  /** Context usage information for token limit display */
  contextUsage?: ContextUsage;

  /** Placeholder text for input */
  inputPlaceholder?: string;

  /** Custom class name */
  className?: string;

  /** Available agent types for selection (shown in empty state) */
  agents?: AgentType[];

  /** Currently selected agent */
  selectedAgent?: AgentType;

  /** Whether the agent selector is disabled */
  isAgentSelectorDisabled?: boolean;

  /** Whether agents are currently loading */
  isAgentsLoading?: boolean;

  /** Available tasks for the task selector (shown in empty state) */
  tasks?: TaskHistoryItem[];

  /** Currently selected task ID */
  selectedTaskId?: string;

  /** Recent chats to display in the empty state */
  recentChats?: TaskHistoryItem[];

  /** Resource counts for session resources button tooltip */
  sessionResourcesCounts?: SessionResourcesCounts;

  /** Callback when scroll position changes (at bottom vs scrolled up) */
  onScrollPositionChange?: (isAtBottom: boolean) => void;
}
