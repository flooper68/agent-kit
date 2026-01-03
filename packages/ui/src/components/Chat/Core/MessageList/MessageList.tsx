import { ArrowDown } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../../lib/utils';

export interface MessageListProps {
  children: React.ReactNode;
  /** Callback when scroll position changes (at bottom vs scrolled up) */
  onScrollPositionChange?: (isAtBottom: boolean) => void;
}

// Threshold in pixels from bottom to consider "at bottom"
const SCROLL_BUTTON_THRESHOLD = 10;

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ children, onScrollPositionChange }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null); // The outer div that scrolls
    const contentRef = useRef<HTMLDivElement>(null);
    const spacerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const isAtBottomRef = useRef(true); // Track if user is at bottom for smart auto-scroll
    const [showScrollButton, setShowScrollButton] = useState(false);

    // useLayoutEffect(() => {
    //   if (isFirstScrollRef.current && contentRef.current) {
    //     contentRef.current.children[
    //       contentRef.current.children.length - 1
    //     ]?.scrollIntoView({ behavior: 'instant' });

    //     isFirstScrollRef.current = false;
    //   }
    // });

    // Forward ref to the content div (used by useAgentSession for spacer logic)
    const setContentRef = (node: HTMLDivElement | null) => {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // const prevChildCountRef = useRef(0);
    // // Track the child count at which we scrolled - prevents double scroll when response is added
    // // but allows new user messages to trigger scroll
    // const scrolledAtChildCountRef = useRef<number | null>(null);
    // // Flag to prevent spacer recalculation during AI streaming after user message scroll
    // const skipSpacerRecalcRef = useRef(false);

    const scrollToBottom = useCallback(() => {
      if (!contentRef.current) return;

      contentRef.current.children[
        contentRef.current.children.length - 1
      ]?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    //   containerRef.current?.scrollTo({ top: 0, behavior });
    // }, []);

    // Scroll the last message to the top of the viewport
    // const scrollLastMessageToTop = useCallback(() => {
    //   const content = contentRef.current;
    //   if (!content) return;

    //   // // Find the last message element (excluding the spacer)
    //   // const messageElements = content.children;
    //   // // The last child is the spacer, so get the second-to-last
    //   // const lastMessage = messageElements[messageElements.length - 2];
    //   // if (!lastMessage) return;

    //   // // Use scrollIntoView to scroll the message to the top
    //   // (lastMessage as HTMLElement).scrollIntoView({
    //   //   behavior: 'smooth',
    //   //   block: 'start',
    //   // });

    //   // isAtBottomRef.current = true;
    //   // setShowScrollButton(false);
    // }, []);

    // Check if user is at the bottom of the scroll container
    const checkScrollPosition = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= SCROLL_BUTTON_THRESHOLD;

      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
      onScrollPositionChange?.(atBottom);
    }, [onScrollPositionChange]);

    // Listen for scroll events
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      container.addEventListener('scroll', checkScrollPosition, {
        passive: true,
      });
      // Initial check
      checkScrollPosition();

      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }, [checkScrollPosition]);

    // Helper to calculate and apply spacer height
    // const calculateSpacerHeight = useCallback(() => {
    //   const container = containerRef.current;
    //   const content = contentRef.current;
    //   const spacer = spacerRef.current;
    //   if (!container || !content || !spacer) return;

    //   const containerHeight = container.clientHeight;
    //   const messageElements = content.children;
    //   // Number of actual messages (excluding spacer)
    //   const messageCount = messageElements.length - 1;

    //   if (messageCount < 1) {
    //     spacer.style.minHeight = '0px';
    //     return;
    //   }

    //   // Spacer is always based on last user message + last response (last 2 messages)
    //   // If only 1 message, just use that one
    //   const startIndex = Math.max(0, messageCount - 2);
    //   let messagesHeight = 0;
    //   for (let i = startIndex; i < messageCount; i++) {
    //     const el = messageElements[i];
    //     if (el) {
    //       messagesHeight += (el as HTMLElement).offsetHeight;
    //     }
    //   }
    //   // Account for gap between last 2 messages (space-y-6 = 1.5rem = 24px)
    //   const numMessages = messageCount - startIndex;
    //   const gaps = Math.max(0, numMessages - 1) * 24;
    //   messagesHeight += gaps;

    //   // Spacer should fill remaining viewport height after last user + response
    //   // Account for avatar offset at top so avatar isn't cut off when scrolled
    //   const avatarOffset = 72;
    //   const calculatedHeight = containerHeight - messagesHeight - avatarOffset;
    //   spacer.style.minHeight = `${Math.max(calculatedHeight, 0)}px`;

    //   // Force a reflow so layout is updated before any scroll calculations
    //   // Reading offsetHeight triggers synchronous layout
    //   void spacer.offsetHeight;
    // }, []);

    // Combined effect for spacer calculation, scroll behavior, and resize observation
    // Use useLayoutEffect to run synchronously before browser paint, preventing visible jumps
    // useLayoutEffect(() => {
    //   const container = containerRef.current;
    //   const content = contentRef.current;
    //   if (!container || !content) return;

    //   const childCount = Children.count(children);

    //   // Detect initial content load (e.g., opening an existing chat)
    //   const isInitialLoad = prevChildCountRef.current === 0 && childCount > 0;

    //   // Detect new message added during session (user sent a message)
    //   const isNewMessageInSession =
    //     prevChildCountRef.current > 0 && childCount > prevChildCountRef.current;

    //   // Skip scroll if this is the response immediately after the user message we scrolled for
    //   const isResponseAfterScroll =
    //     scrolledAtChildCountRef.current !== null &&
    //     childCount === scrolledAtChildCountRef.current + 1;

    //   // Capture the user message index before updating prevChildCountRef
    //   const userMessageIndex = prevChildCountRef.current;

    //   console.log('[MessageList] Effect run:', {
    //     childCount,
    //     prevChildCount: prevChildCountRef.current,
    //     scrolledAtChildCount: scrolledAtChildCountRef.current,
    //     isInitialLoad,
    //     isNewMessageInSession,
    //     isResponseAfterScroll,
    //     userMessageIndex,
    //   });

    //   // Only calculate spacer height if not handling AI response after user scroll
    //   // This prevents layout shifts during streaming
    //   if (!isResponseAfterScroll) {
    //     calculateSpacerHeight();
    //   }

    //   // Handle scrolling based on scenario
    //   if (isInitialLoad) {
    //     // Reset scroll state for fresh load
    //     isAtBottomRef.current = true;
    //     isFirstScrollRef.current = true;
    //     scrolledAtChildCountRef.current = null;
    //     skipSpacerRecalcRef.current = false;
    //     setShowScrollButton(false);

    //     const messageCount = content.children.length - 1; // Exclude spacer
    //     if (messageCount >= 1) {
    //       // Get last message element
    //       const lastMessage = content.children[messageCount - 1] as HTMLElement;
    //       if (lastMessage) {
    //         // Calculate scroll position so last message bottom = viewport bottom
    //         const containerRect = container.getBoundingClientRect();
    //         const messageRect = lastMessage.getBoundingClientRect();
    //         const messageBottom = messageRect.bottom - containerRect.top;
    //         const viewportHeight = container.clientHeight;
    //         const scrollTop =
    //           container.scrollTop + messageBottom - viewportHeight + 24;

    //         container.scrollTo({
    //           top: Math.max(0, scrollTop),
    //           behavior: 'instant',
    //         });
    //       }
    //     }
    //   } else if (isNewMessageInSession && !isResponseAfterScroll) {
    //     // New user message - scroll to top
    //     scrolledAtChildCountRef.current = childCount;
    //     isAtBottomRef.current = false;
    //     skipSpacerRecalcRef.current = true; // Prevent spacer recalculation during AI streaming
    //     setShowScrollButton(false); // Hide scroll button initially, will show based on scroll position

    //     const userMessage = content.children[userMessageIndex] as HTMLElement;
    //     console.log('[MessageList] Scrolling to user message:', {
    //       userMessageIndex,
    //       userMessage: !!userMessage,
    //       childrenCount: content.children.length,
    //     });
    //     if (userMessage) {
    //       // Calculate scroll position directly using getBoundingClientRect
    //       const containerRect = container.getBoundingClientRect();
    //       const messageRect = userMessage.getBoundingClientRect();
    //       const avatarOffset = 72; // Extra space for avatar above message

    //       // How far is the message from the container's visible top?
    //       const distanceFromTop = messageRect.top - containerRect.top;

    //       // Adjust scroll to put message at avatarOffset from top
    //       const newScrollTop =
    //         container.scrollTop + distanceFromTop - avatarOffset;

    //       console.log('[MessageList] Scroll calculation:', {
    //         containerScrollTop: container.scrollTop,
    //         distanceFromTop,
    //         avatarOffset,
    //         newScrollTop,
    //       });

    //       container.scrollTo({
    //         top: Math.max(0, newScrollTop),
    //         behavior: 'instant',
    //       });
    //     }
    //   }

    //   // Update prev child count synchronously to avoid race conditions
    //   // (must happen before next effect run, not inside RAF)
    //   prevChildCountRef.current = childCount;

    //   // Recalculate spacer on resize, but not during AI streaming after user message scroll
    //   // This prevents layout shifts that cause the "jump to middle" bug
    //   const resizeObserver = new ResizeObserver(() => {
    //     // Skip spacer recalculation if we just scrolled for a user message
    //     // This flag is cleared when user clicks scroll-to-bottom or sends new message
    //     if (!skipSpacerRecalcRef.current) {
    //       calculateSpacerHeight();
    //     }
    //   });

    //   resizeObserver.observe(container);

    //   // Observe all message elements to detect height changes during streaming
    //   const messageElements = content.children;
    //   for (let i = 0; i < messageElements.length - 1; i++) {
    //     const el = messageElements[i];
    //     if (el) {
    //       resizeObserver.observe(el);
    //     }
    //   }

    //   return () => {
    //     resizeObserver.disconnect();
    //   };
    // }, [children, calculateSpacerHeight]);

    // const handleScrollButtonClick = useCallback(() => {
    //   // isAtBottomRef.current = true; // Re-enable auto-scroll immediately
    //   // skipSpacerRecalcRef.current = false; // Re-enable spacer recalculation
    //   // calculateSpacerHeight(); // Recalculate spacer now
    //   // scrollToBottom('smooth');
    // }, []);

    return (
      <>
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-6 scrollbar-thin'
          )}
        >
          <div
            ref={setContentRef}
            className="max-w-3xl mx-auto px-4 space-y-6 min-w-0"
          >
            {children}
            {/* Spacer to allow any message to scroll to the top of the viewport */}
            <div ref={spacerRef} aria-hidden="true" />
          </div>
          <div ref={bottomRef} aria-hidden="true" />
        </div>

        {/* Scroll to bottom button - positioned above the input area */}
        <div className="relative h-0">
          <button
            type="button"
            onClick={scrollToBottom}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-12',
              'h-8 w-8 rounded-full',
              'bg-background border border-border shadow-md',
              'flex items-center justify-center',
              'text-muted-foreground hover:text-foreground',
              'transition-all duration-200',
              showScrollButton
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-90 pointer-events-none'
            )}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }
);

MessageList.displayName = 'MessageList';
