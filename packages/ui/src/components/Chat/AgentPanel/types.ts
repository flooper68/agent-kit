import type { ReactNode } from 'react';
import type {
  TaskMessage,
  TaskStatus,
  SuggestionChip,
  ContextUsage,
  AgentType,
  TaskHistoryItem,
  TodoItem,
  ToolInvocationPart,
  ToolResultPart,
} from '../../../types/chat';
import type { SessionResourcesCounts } from '../Controls/SessionResourcesButton';
import type { SlashCommandChip } from '../Core/ChatInput';
import type { RichTextInputRef } from '../Core/RichTextInput';

/**
 * Props passed to the renderSubAgentCard render function
 */
export interface RenderSubAgentCardProps {
  /** Session ID for the sub-agent (available after spawning) */
  sessionId: string | undefined;
  /** Name of the agent */
  agentName: string;
  /** Tool invocation state */
  toolState: ToolInvocationPart['state'];
  /** Tool result (if available) */
  toolResult?: ToolResultPart;
  /** Callback when "Open Full View" is clicked */
  onOpenFullView?: () => void;
  /** Callback when a nested sub-agent dialog should open */
  onOpenSubAgentDialog?: (sessionId: string) => void;
}

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

  /** Called when user wants to open a sub-agent's full view dialog */
  onOpenSubAgentDialog?: (sessionId: string) => void;
}

/**
 * Status for compact mode sub-agent display
 */
export type CompactStatus = 'pending' | 'running' | 'complete' | 'error';

/**
 * Main AgentPanel component props
 */
export interface AgentPanelProps extends AgentPanelCallbacks {
  /** Array of task messages to display */
  messages: TaskMessage[];

  /** Current status of the task */
  status: TaskStatus;

  /** Display variant - 'full' (default) or 'compact' for inline sub-agent card view */
  variant?: 'full' | 'compact';

  /** Compact mode: Agent name to display in header */
  agentName?: string;

  /** Compact mode: Current status badge */
  compactStatus?: CompactStatus;

  /** Compact mode: Callback when "Open Full View" is clicked */
  onOpenFullView?: () => void;

  /** Compact mode: Callback for retry on error */
  onCompactRetry?: () => void;

  /** Compact mode: Formatted elapsed time label (e.g., "5s" or "1m 23s"). Pass null to hide. */
  compactElapsedLabel?: string | null;

  /** Compact mode: Error message to display when status is error */
  compactErrorMessage?: string;

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

  /** Formatted elapsed time label for running time indicator (e.g., "5s" or "1m 23s"). Pass null to hide. */
  elapsedLabel?: string | null;

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

  /** Current todos from TodoWrite tool to display in floating panel */
  todos?: TodoItem[];

  /** Callback when scroll position changes (at bottom vs scrolled up) */
  onScrollPositionChange?: (isAtBottom: boolean) => void;

  /** Whether the scroll-to-bottom button should be shown */
  showScrollButton?: boolean;

  /** Callback when scroll container ref changes */
  scrollContainerRef?: (node: HTMLDivElement | null) => void;

  /** Callback when input ref changes (for external focus control) */
  inputRef?: (node: HTMLTextAreaElement | null) => void;

  /**
   * Enable rich text input with inline chip support.
   * When enabled, uses RichTextarea instead of Textarea.
   */
  enableRichTextInput?: boolean;

  /** Callback when rich text input ref changes (for external focus/insertChip control) */
  richTextInputRef?: (ref: RichTextInputRef | null) => void;

  /** Current slash command chips (for rich text input) */
  chips?: SlashCommandChip[];

  /** Callback when chips change (for rich text input) */
  onChipsChange?: (chips: SlashCommandChip[]) => void;

  /** Controlled input value (for rich text input) */
  value?: string;

  /** Callback when input value changes (for rich text input) */
  onValueChange?: (value: string) => void;

  /** Callback when cursor position changes (for rich text input) */
  onCursorPositionChange?: (position: number) => void;

  /** Whether the input is disabled (read-only mode for sub-agent views) */
  inputDisabled?: boolean;

  /**
   * Custom render function for sub-agent cards (spawnAgent tool invocations).
   * Use this to inject a connected component that can subscribe to streaming.
   * If not provided, falls back to the default SubAgentCard.
   */
  renderSubAgentCard?: (props: RenderSubAgentCardProps) => ReactNode;

  /**
   * Optional approval banner to display above the chat input.
   * Rendered in the same position as error banners.
   */
  approvalBanner?: ReactNode;
}

/**
 * Ref handle for AgentPanel
 */
export interface AgentPanelRef {
  /** Focus the chat input textarea */
  focusInput: () => void;
  /** Get the scroll container element */
  getScrollContainer: () => HTMLDivElement | null;
}
