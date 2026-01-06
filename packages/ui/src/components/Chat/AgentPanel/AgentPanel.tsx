import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react';
import { cn } from '../../../lib/utils';
import { ChatContainer } from '../Core/ChatContainer';
import { MessageList } from '../Core/MessageList';
import { ChatInput } from '../Core/ChatInput';
import { EmptyState } from '../States/EmptyState';
import { LoadingState } from '../States/LoadingState';
import { ErrorBanner } from '../Banners/ErrorBanner';
import { TokenLimitBanner } from '../Banners/TokenLimitBanner';
import { InterruptButton } from '../AIFeatures/InterruptButton';
import { TodosFloatingPanel } from '../TodosFloatingPanel';
import { MessageListItem } from './MessageItem';
import { InputActions } from './InputActions';
import type { AgentPanelProps, AgentPanelRef } from './types';

/**
 * AgentPanel - A complete chat interface component
 *
 * Composes all Chat primitives into a cohesive AI assistant experience.
 * Handles all states: empty, loading, streaming, error, and normal conversation.
 */
export const AgentPanel = memo(
  forwardRef<AgentPanelRef, AgentPanelProps>(
    (
      {
        messages,
        status,
        error,
        suggestions = [],
        emptyStateConfig,
        avatars,
        enableAttachments = false,
        enableRegenerate = false,
        contextUsage,
        inputPlaceholder = 'Ask the agent...',
        className,
        onSend,
        onInterrupt,
        onRetry,
        onSuggestionClick,
        onRegenerate,
        onErrorDismiss,
        onAttach,
        onAgentSelect,
        agents,
        selectedAgent,
        isAgentSelectorDisabled,
        isAgentsLoading,
        recentChats,
        onRecentChatClick,
        onRecentChatDelete,
        onScrollPositionChange,
        onInspect,
        onSessionResources,
        sessionResourcesCounts,
        todos,
        scrollContainerRef: scrollContainerRefProp,
        inputRef: inputRefProp,
      },
      ref
    ) => {
      const internalInputRef = useRef<HTMLTextAreaElement>(null);
      const internalScrollRef = useRef<HTMLDivElement>(null);

      // Combine internal refs with external callback refs
      const setInputRef = useCallback(
        (node: HTMLTextAreaElement | null) => {
          (
            internalInputRef as React.MutableRefObject<HTMLTextAreaElement | null>
          ).current = node;
          inputRefProp?.(node);
        },
        [inputRefProp]
      );

      const setScrollRef = useCallback(
        (node: HTMLDivElement | null) => {
          (
            internalScrollRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          scrollContainerRefProp?.(node);
        },
        [scrollContainerRefProp]
      );

      // Expose methods via ref
      useImperativeHandle(
        ref,
        () => ({
          focusInput: () => {
            internalInputRef.current?.focus();
          },
          getScrollContainer: () => internalScrollRef.current,
        }),
        []
      );

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
        (
          role: 'user' | 'assistant'
        ): { src?: string; fallback: string; name?: string } => {
          if (role === 'user') {
            return {
              src: avatars?.user?.src,
              fallback: avatars?.user?.fallback ?? 'U',
              name: avatars?.user?.name,
            };
          }
          return {
            src: avatars?.assistant?.src,
            fallback: avatars?.assistant?.fallback ?? 'AI',
            name: avatars?.assistant?.name,
          };
        },
        [avatars]
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

      return (
        <ChatContainer className={cn('h-full', className)}>
          {/* Main content area */}
          {status === 'loading' ? (
            <LoadingState />
          ) : showEmptyState ? (
            <EmptyState
              title={emptyStateConfig?.title}
              description={emptyStateConfig?.description}
              suggestions={suggestions}
              onSuggestionClick={onSuggestionClick}
              recentChats={recentChats}
              onRecentChatClick={onRecentChatClick}
              onRecentChatDelete={onRecentChatDelete}
              inputElement={
                <ChatInput isSubmitting={isSubmitting} onSubmit={handleSubmit}>
                  <ChatInput.Textarea
                    ref={setInputRef}
                    placeholder={inputPlaceholder}
                    autoFocus
                  />
                  <ChatInput.Actions>
                    <InputActions
                      enableAttachments={enableAttachments}
                      onAttach={onAttach}
                      isAgentSelectorDisabled={!!isAgentSelectorDisabled}
                      selectedAgent={selectedAgent}
                      isAgentsLoading={isAgentsLoading}
                      agents={agents}
                      onAgentSelect={onAgentSelect}
                      onInspect={onInspect}
                      onSessionResources={onSessionResources}
                      sessionResourcesCounts={sessionResourcesCounts}
                      contextUsage={contextUsage}
                    />
                  </ChatInput.Actions>
                </ChatInput>
              }
            />
          ) : (
            <MessageList
              ref={setScrollRef}
              onScrollPositionChange={onScrollPositionChange}
            >
              {messages.map((message, index) => (
                <MessageListItem
                  key={message.id}
                  message={message}
                  index={index}
                  messagesLength={messages.length}
                  isSubmitting={isSubmitting}
                  avatar={getAvatar(message.role as 'user' | 'assistant')}
                  enableRegenerate={enableRegenerate}
                  onRegenerate={onRegenerate}
                />
              ))}
            </MessageList>
          )}

          {/* Interrupt button when processing (submitted or streaming) */}
          {isSubmitting && onInterrupt && (
            <div className="pb-2 flex justify-center">
              <InterruptButton onClick={onInterrupt} />
            </div>
          )}

          {/* Banners RIGHT ABOVE input (only when not in empty state) */}
          {!showEmptyState && (
            <div className="max-w-3xl mx-auto w-full">
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
            </div>
          )}

          {/* Todos floating panel (only when not in empty state and todos exist) */}
          {!showEmptyState && todos && todos.length > 0 && (
            <div className="max-w-3xl mx-auto w-full px-4">
              <TodosFloatingPanel todos={todos} />
            </div>
          )}

          {/* Input area (only when not in empty state) */}
          {!showEmptyState && (
            <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
              <ChatInput isSubmitting={isSubmitting} onSubmit={handleSubmit}>
                <ChatInput.Textarea
                  ref={setInputRef}
                  placeholder={inputPlaceholder}
                  autoFocus
                />
                <ChatInput.Actions>
                  <InputActions
                    enableAttachments={enableAttachments}
                    onAttach={onAttach}
                    isAgentSelectorDisabled={!!isAgentSelectorDisabled}
                    selectedAgent={selectedAgent}
                    isAgentsLoading={isAgentsLoading}
                    agents={agents}
                    onAgentSelect={onAgentSelect}
                    onInspect={onInspect}
                    onSessionResources={onSessionResources}
                    sessionResourcesCounts={sessionResourcesCounts}
                    contextUsage={contextUsage}
                  />
                </ChatInput.Actions>
              </ChatInput>
            </div>
          )}
        </ChatContainer>
      );
    }
  )
);

AgentPanel.displayName = 'AgentPanel';
