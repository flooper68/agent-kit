import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react';
import { ScanSearch } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../IconButton';
import { ChatContainer } from '../Core/ChatContainer';
import { MessageList } from '../Core/MessageList';
import { ChatInput, type SlashCommandChip } from '../Core/ChatInput';
import type { RichTextInputRef } from '../Core/RichTextInput';
import { EmptyState } from '../States/EmptyState';
import { LoadingState } from '../States/LoadingState';
import { ErrorBanner } from '../Banners/ErrorBanner';
import { TokenLimitBanner } from '../Banners/TokenLimitBanner';
import { InterruptButton } from '../AIFeatures/InterruptButton';
import { TodosFloatingPanel } from '../TodosFloatingPanel';
import { ContextIndicator } from '../Controls/ContextIndicator';
import { RunningTimeIndicator } from '../Controls/RunningTimeIndicator';
import { AgentInfoBadge } from '../Controls/AgentInfoBadge';
import { MessageListItem } from './MessageItem';
import { InputActions } from './InputActions';
import { CompactAgentCard } from './CompactAgentCard';
import { expandChipsInMessage } from '../utils/slash-commands';
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
        showScrollButton,
        onInspect,
        onSessionResources,
        sessionResourcesCounts,
        todos,
        elapsedLabel,
        scrollContainerRef: scrollContainerRefProp,
        inputRef: inputRefProp,
        enableRichTextInput = false,
        richTextInputRef: richTextInputRefProp,
        chips,
        onChipsChange,
        value,
        onValueChange,
        onOpenSubAgentDialog,
        inputDisabled = false,
        renderSubAgentCard,
        approvalBanner,
        // Compact mode props
        variant = 'full',
        agentName,
        compactStatus,
        compactElapsedLabel,
        compactErrorMessage,
        onOpenFullView,
        onCompactRetry,
      },
      ref
    ) => {
      const internalInputRef = useRef<HTMLTextAreaElement>(null);
      const internalRichInputRef = useRef<RichTextInputRef>(null);
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

      const setRichInputRef = useCallback(
        (node: RichTextInputRef | null) => {
          (
            internalRichInputRef as React.MutableRefObject<RichTextInputRef | null>
          ).current = node;
          richTextInputRefProp?.(node);
        },
        [richTextInputRefProp]
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
            if (enableRichTextInput) {
              internalRichInputRef.current?.focus();
            } else {
              internalInputRef.current?.focus();
            }
          },
          getScrollContainer: () => internalScrollRef.current,
        }),
        [enableRichTextInput]
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
        (value: string, submittedChips?: SlashCommandChip[]) => {
          const hasContent =
            value.trim() || (submittedChips && submittedChips.length > 0);
          if (hasContent && !isSubmitting) {
            // Expand chips into the message if present
            const finalMessage = expandChipsInMessage(
              value,
              submittedChips ?? []
            );
            onSend(finalMessage);
          }
        },
        [isSubmitting, onSend]
      );

      // Compact mode: render the CompactAgentCard instead of full panel
      if (variant === 'compact') {
        return (
          <CompactAgentCard
            agentName={agentName ?? 'Agent'}
            status={compactStatus ?? 'pending'}
            messages={messages}
            elapsedLabel={compactElapsedLabel}
            errorMessage={compactErrorMessage}
            onOpenFullView={onOpenFullView}
            onRetry={onCompactRetry}
            onOpenSubAgentDialog={onOpenSubAgentDialog}
          />
        );
      }

      return (
        <ChatContainer className={cn('h-full', className)}>
          {/* Main content area */}
          {status === 'loading' ? (
            <LoadingState />
          ) : showEmptyState && inputDisabled ? (
            // No-op empty state for read-only mode (sub-agent views)
            <div className="flex-1" />
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
                <ChatInput
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  value={enableRichTextInput ? value : undefined}
                  onValueChange={
                    enableRichTextInput ? onValueChange : undefined
                  }
                  chips={enableRichTextInput ? chips : undefined}
                  onChipsChange={
                    enableRichTextInput ? onChipsChange : undefined
                  }
                >
                  {enableRichTextInput ? (
                    <ChatInput.RichTextarea
                      ref={setRichInputRef}
                      placeholder={inputPlaceholder}
                      autoFocus
                    />
                  ) : (
                    <ChatInput.Textarea
                      ref={setInputRef}
                      placeholder={inputPlaceholder}
                      autoFocus
                    />
                  )}
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
                      status={status}
                      elapsedLabel={elapsedLabel}
                    />
                  </ChatInput.Actions>
                </ChatInput>
              }
            />
          ) : (
            <MessageList
              ref={setScrollRef}
              onScrollPositionChange={onScrollPositionChange}
              showScrollButton={showScrollButton}
            >
              {messages.map((message, index) => (
                <MessageListItem
                  // Id changes (optimistic→real) but index stays same
                  key={index}
                  message={message}
                  index={index}
                  messagesLength={messages.length}
                  isSubmitting={isSubmitting}
                  avatar={getAvatar(message.role as 'user' | 'assistant')}
                  enableRegenerate={enableRegenerate}
                  onRegenerate={onRegenerate}
                  onOpenSubAgentDialog={onOpenSubAgentDialog}
                  renderSubAgentCard={renderSubAgentCard}
                  agents={agents}
                />
              ))}
            </MessageList>
          )}

          {/* Interrupt button when processing (submitted or streaming) - skip in read-only mode */}
          {isSubmitting && onInterrupt && !inputDisabled && (
            <div className="pb-2 flex justify-center">
              <InterruptButton onClick={onInterrupt} />
            </div>
          )}

          {/* Banners RIGHT ABOVE input (only when not in empty state) */}
          {!showEmptyState && (
            <div className="max-w-3xl mx-auto w-full">
              {showTokenWarning &&
                contextUsage &&
                !selectedAgent?.isExternal && (
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
              {approvalBanner && <div className="px-4">{approvalBanner}</div>}
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
            <div className="max-w-3xl mx-auto w-full px-4 pb-6 pt-2">
              <ChatInput
                isSubmitting={isSubmitting || inputDisabled}
                onSubmit={handleSubmit}
                value={enableRichTextInput ? value : undefined}
                onValueChange={enableRichTextInput ? onValueChange : undefined}
                chips={enableRichTextInput ? chips : undefined}
                onChipsChange={enableRichTextInput ? onChipsChange : undefined}
              >
                {enableRichTextInput ? (
                  <ChatInput.RichTextarea
                    ref={setRichInputRef}
                    placeholder={
                      inputDisabled ? 'Read-only view' : inputPlaceholder
                    }
                    autoFocus={!inputDisabled}
                    disabled={inputDisabled}
                  />
                ) : (
                  <ChatInput.Textarea
                    ref={setInputRef}
                    placeholder={
                      inputDisabled ? 'Read-only view' : inputPlaceholder
                    }
                    autoFocus={!inputDisabled}
                    disabled={inputDisabled}
                  />
                )}
                <ChatInput.Actions>
                  {inputDisabled ? (
                    // Show agent info, inspect, running time, and context in read-only mode
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1">
                        {selectedAgent && (
                          <AgentInfoBadge agent={selectedAgent} />
                        )}
                        {onInspect && (
                          <IconButton
                            icon={<ScanSearch className="h-4 w-4" />}
                            label="Inspect session"
                            size="sm"
                            onClick={onInspect}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <RunningTimeIndicator
                          status={status}
                          elapsedLabel={elapsedLabel}
                        />
                        {!selectedAgent?.isExternal && contextUsage && (
                          <ContextIndicator usage={contextUsage} />
                        )}
                      </div>
                    </div>
                  ) : (
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
                      status={status}
                      elapsedLabel={elapsedLabel}
                    />
                  )}
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
