import type {
  ChatMessage,
  ChatStatus,
  SuggestionChip,
  ModelOption,
  ContextUsage,
  ThinkingStatus,
} from '../../../types/chat';

/**
 * Error information for the chat
 */
export interface ChatError {
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

  /** Called when model is changed (if model switcher enabled) */
  onModelChange?: (model: ModelOption) => void;

  /** Called when files are attached */
  onAttach?: (files: File[]) => void;
}

/**
 * Main AgentPanel component props
 */
export interface AgentPanelProps extends AgentPanelCallbacks {
  /** Array of chat messages to display */
  messages: ChatMessage[];

  /** Current status of the chat */
  status: ChatStatus;

  /** Error information if status is 'error' */
  error?: ChatError | null;

  /** Configuration for suggestions in empty state */
  suggestions?: SuggestionChip[];

  /** Configuration for the empty state */
  emptyStateConfig?: EmptyStateConfig;

  /** Avatar configuration for user and assistant */
  avatars?: AvatarConfig;

  /** Thinking status information */
  thinkingStatus?: ThinkingStatus;

  /** Whether attachments are enabled */
  enableAttachments?: boolean;

  /** Whether regenerate button is shown on assistant messages */
  enableRegenerate?: boolean;

  /** Available models for the model switcher (required) */
  models: ModelOption[];

  /** Currently selected model (defaults to first model) */
  selectedModel?: ModelOption;

  /** Context usage information for token limit display */
  contextUsage?: ContextUsage;

  /** Placeholder text for input */
  inputPlaceholder?: string;

  /** Custom class name */
  className?: string;
}

/**
 * Imperative handle for AgentPanel
 */
export interface AgentPanelRef {
  /** Scroll to the bottom of the message list */
  scrollToBottom: (behavior?: ScrollBehavior) => void;

  /** Scroll to the top of the message list */
  scrollToTop: (behavior?: ScrollBehavior) => void;

  /** Focus the input textarea */
  focusInput: () => void;
}
