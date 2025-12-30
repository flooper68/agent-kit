import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from 'react';
import { cn } from '../../../lib/utils';
import type {
  TaskMessage,
  MessagePart,
  TextPart,
  ToolInvocationPart,
  ToolResultPart,
  ReasoningPart,
  ImagePart,
} from '../../../types/chat';
import { ChatContainer } from '../Core/ChatContainer';
import { MessageList, type MessageListRef } from '../Core/MessageList';
import { Message } from '../Core/Message';
import { ChatInput } from '../Core/ChatInput';
import { EmptyState } from '../States/EmptyState';
import { ErrorBanner } from '../Banners/ErrorBanner';
import { TokenLimitBanner } from '../Banners/TokenLimitBanner';
import { ThinkingIndicator } from '../AIFeatures/ThinkingIndicator';
import { InterruptButton } from '../AIFeatures/InterruptButton';
import { ReasoningDisplay } from '../AIFeatures/ReasoningDisplay';
import { ToolBadge } from '../ToolDisplay/ToolBadge';
import { MarkdownRenderer } from '../CodeDisplay/MarkdownRenderer';
import { CopyButton, RegenerateButton } from '../Controls';
import { AttachmentButton } from '../Controls/AttachmentButton';
import { ModelSwitcher } from '../Controls/ModelSwitcher';
import { ContextIndicator } from '../Controls/ContextIndicator';
import { AgentSelector } from '../Controls/AgentSelector';
import { AgentInfoBadge } from '../Controls/AgentInfoBadge';
import type { AgentPanelProps, AgentPanelRef } from './types';

/**
 * Get text content from a message for copying
 */
function getTextContent(message: TaskMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.content)
    .join('\n');
}

/**
 * Format timestamp for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format full timestamp for tooltip
 */
function formatFullTimestamp(date: Date): string {
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * AgentPanel - A complete chat interface component
 *
 * Composes all Chat primitives into a cohesive AI assistant experience.
 * Handles all states: empty, loading, streaming, error, and normal conversation.
 */
export const AgentPanel = forwardRef<AgentPanelRef, AgentPanelProps>(
  (
    {
      messages,
      status,
      error,
      suggestions = [],
      emptyStateConfig,
      avatars,
      thinkingStatus,
      enableAttachments = false,
      enableRegenerate = false,
      models,
      selectedModel,
      contextUsage,
      inputPlaceholder = 'Ask the agent...',
      className,
      onSend,
      onInterrupt,
      onRetry,
      onSuggestionClick,
      onRegenerate,
      onErrorDismiss,
      onModelChange,
      onAttach,
      onAgentSelect,
      agents,
      selectedAgent,
    },
    ref
  ) => {
    const messageListRef = useRef<MessageListRef>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      scrollToBottom: (behavior) =>
        messageListRef.current?.scrollToBottom(behavior),
      scrollToTop: (behavior) => messageListRef.current?.scrollToTop(behavior),
      focusInput: () => inputRef.current?.focus(),
    }));

    // Derived state (memoized)
    const isEmpty = useMemo(() => messages.length === 0, [messages.length]);
    const isSubmitting = useMemo(
      () => status === 'submitted' || status === 'streaming',
      [status]
    );
    const hasError = useMemo(
      () => status === 'error' && error,
      [status, error]
    );
    const showTokenWarning = useMemo(
      () => contextUsage && contextUsage.percentage > 80,
      [contextUsage]
    );
    const showEmptyState = useMemo(
      () => isEmpty && status === 'ready',
      [isEmpty, status]
    );

    // Helper to get avatar config for a message role (memoized)
    const getAvatar = useCallback(
      (role: 'user' | 'assistant') => {
        if (role === 'user') {
          return avatars?.user ?? { fallback: 'U' };
        }
        return avatars?.assistant ?? { fallback: 'AI' };
      },
      [avatars]
    );

    // Find matching tool result for a tool invocation
    const findToolResult = useCallback(
      (
        message: TaskMessage,
        toolCallId: string
      ): ToolResultPart | undefined => {
        return message.parts.find(
          (p): p is ToolResultPart =>
            p.type === 'tool_result' && p.toolCallId === toolCallId
        );
      },
      []
    );

    // Render individual message part (memoized)
    const renderPart = useCallback(
      (part: MessagePart, index: number, message: TaskMessage) => {
        switch (part.type) {
          case 'text': {
            const textPart = part as TextPart;
            return (
              <MarkdownRenderer
                key={part.id || index}
                content={textPart.content}
              />
            );
          }
          case 'reasoning': {
            const reasoningPart = part as ReasoningPart;
            return (
              <ReasoningDisplay
                key={part.id || index}
                content={reasoningPart.content}
                defaultExpanded={!reasoningPart.isCollapsed}
              />
            );
          }
          case 'tool_invocation': {
            const toolPart = part as ToolInvocationPart;
            const result = findToolResult(message, toolPart.toolCallId);
            return (
              <div key={part.id || index} className="block">
                <ToolBadge
                  toolName={toolPart.toolName}
                  state={toolPart.state}
                  args={toolPart.args}
                  toolCallId={toolPart.toolCallId}
                  result={result}
                />
              </div>
            );
          }
          case 'image': {
            const imagePart = part as ImagePart;
            return (
              <img
                key={part.id || index}
                src={imagePart.url}
                alt={imagePart.alt ?? 'Image'}
                className="max-w-full rounded-lg"
              />
            );
          }
          default:
            return null;
        }
      },
      [findToolResult]
    );

    // Render message content (memoized)
    const renderMessageContent = useCallback(
      (message: TaskMessage) => {
        return (
          <div className="space-y-2">
            {message.parts.map((part, index) =>
              renderPart(part, index, message)
            )}
          </div>
        );
      },
      [renderPart]
    );

    // Render a single message (memoized)
    const renderMessage = useCallback(
      (message: TaskMessage) => {
        const avatar = getAvatar(message.role as 'user' | 'assistant');
        const isUser = message.role === 'user';

        const tooltipName = isUser
          ? (avatars?.user?.name ?? 'You')
          : (avatars?.assistant?.name ?? 'Assistant');

        return (
          <Message key={message.id} role={message.role}>
            {isUser && (
              <Message.Avatar
                {...avatar}
                className="h-8 w-8"
                tooltip={tooltipName}
              />
            )}
            <Message.Bubble>{renderMessageContent(message)}</Message.Bubble>
            <Message.Actions>
              {isUser && (
                <span
                  className="text-xs text-muted-foreground cursor-default opacity-0 group-hover:opacity-100 transition-opacity"
                  title={formatFullTimestamp(message.createdAt)}
                >
                  {formatTime(message.createdAt)}
                </span>
              )}
              <CopyButton content={getTextContent(message)} />
              {!isUser && enableRegenerate && onRegenerate && (
                <RegenerateButton
                  onRegenerate={() => onRegenerate(message.id)}
                />
              )}
              {!isUser && (
                <span
                  className="text-xs text-muted-foreground cursor-default opacity-0 group-hover:opacity-100 transition-opacity"
                  title={formatFullTimestamp(message.createdAt)}
                >
                  {formatTime(message.createdAt)}
                </span>
              )}
            </Message.Actions>
          </Message>
        );
      },
      [getAvatar, renderMessageContent, enableRegenerate, onRegenerate, avatars]
    );

    // Handle form submission (memoized)
    const handleSubmit = useCallback(
      (value: string) => {
        if (value.trim() && !isSubmitting) {
          onSend(value.trim());
        }
      },
      [isSubmitting, onSend]
    );

    // Handle model change (memoized)
    const handleModelChange = useCallback(
      (modelId: string) => {
        const model = models.find((m) => m.id === modelId);
        if (model) {
          onModelChange?.(model);
        }
      },
      [models, onModelChange]
    );

    // Get current model value
    const currentModelId = useMemo(
      () => selectedModel?.id ?? models[0]?.id,
      [selectedModel, models]
    );

    // Render the input actions
    const renderInputActions = () => (
      <>
        <div className="flex items-center gap-1">
          {enableAttachments && onAttach && (
            <AttachmentButton onAttach={onAttach} showMenu={false} />
          )}
          {models.length > 0 && (
            <ModelSwitcher
              models={models}
              value={currentModelId}
              onChange={handleModelChange}
            />
          )}
        </div>
        {contextUsage && <ContextIndicator usage={contextUsage} />}
      </>
    );

    return (
      <ChatContainer className={cn('h-full', className)}>
        {/* Main content area */}
        {showEmptyState ? (
          <EmptyState
            title={emptyStateConfig?.title}
            description={emptyStateConfig?.description}
            suggestions={suggestions}
            onSuggestionClick={onSuggestionClick}
            inputElement={
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AgentSelector
                    agents={agents ?? []}
                    selectedAgent={selectedAgent}
                    onSelect={onAgentSelect}
                    placeholder="Select an agent..."
                    className="w-full max-w-md"
                  />
                </div>
                <ChatInput isSubmitting={isSubmitting} onSubmit={handleSubmit}>
                  <ChatInput.Textarea
                    ref={inputRef}
                    placeholder={inputPlaceholder}
                  />
                  <ChatInput.Actions>{renderInputActions()}</ChatInput.Actions>
                </ChatInput>
              </div>
            }
          />
        ) : (
          <MessageList ref={messageListRef}>
            {messages.map(renderMessage)}

            {/* Thinking indicator when submitted */}
            {status === 'submitted' && thinkingStatus?.isThinking && (
              <Message role="assistant">
                <Message.Bubble>
                  <ThinkingIndicator
                    status={thinkingStatus.status}
                    detail={thinkingStatus.detail}
                  />
                </Message.Bubble>
              </Message>
            )}
          </MessageList>
        )}

        {/* Interrupt button when processing (submitted or streaming) */}
        {isSubmitting && onInterrupt && (
          <div className="px-4 pb-2 flex justify-center">
            <InterruptButton onClick={onInterrupt} />
          </div>
        )}

        {/* Banners RIGHT ABOVE input (only when not in empty state) */}
        {!showEmptyState && (
          <>
            {showTokenWarning && contextUsage && (
              <div className="px-4">
                <TokenLimitBanner usage={contextUsage} />
              </div>
            )}
            {hasError && error && (
              <div className="px-4">
                <ErrorBanner
                  message={error.message}
                  onDismiss={onErrorDismiss}
                  onRetry={error.retryable ? onRetry : undefined}
                />
              </div>
            )}
          </>
        )}

        {/* Input area (only when not in empty state) */}
        {!showEmptyState && (
          <div className="px-4 pb-4 pt-2">
            <ChatInput isSubmitting={isSubmitting} onSubmit={handleSubmit}>
              <ChatInput.Textarea
                ref={inputRef}
                placeholder={inputPlaceholder}
              />
              <ChatInput.Actions>
                {renderInputActions()}
                {selectedAgent && <AgentInfoBadge agent={selectedAgent} />}
              </ChatInput.Actions>
            </ChatInput>
          </div>
        )}
      </ChatContainer>
    );
  }
);

AgentPanel.displayName = 'AgentPanel';
