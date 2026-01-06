import { ArrowDown } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { cn } from '../../../../lib/utils';

export interface MessageListProps {
  children: React.ReactNode;
  /** Callback when scroll position changes (at bottom vs scrolled up) */
  onScrollPositionChange?: (isAtBottom: boolean) => void;
  /** Whether the scroll-to-bottom button should be shown (controlled from parent) */
  showScrollButton?: boolean;
}

// Threshold in pixels from bottom to consider "at bottom"
const SCROLL_BUTTON_THRESHOLD = 10;

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ children, onScrollPositionChange, showScrollButton = false }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null); // The outer div that scrolls
    const contentRef = useRef<HTMLDivElement>(null);

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

    const scrollToBottom = useCallback(() => {
      if (!contentRef.current) return;

      contentRef.current.children[
        contentRef.current.children.length - 1
      ]?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Check if user is at the bottom of the scroll container
    const checkScrollPosition = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= SCROLL_BUTTON_THRESHOLD;

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
            <div aria-hidden="true" />
          </div>
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
