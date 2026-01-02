import {
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
  useCallback,
  Children,
} from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export interface MessageListProps {
  children: React.ReactNode;
  autoScroll?: boolean;
}

export interface MessageListRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  scrollToTop: (behavior?: ScrollBehavior) => void;
}

// Threshold in pixels from bottom to consider "at bottom"
// Larger threshold handles big content blocks like markdown during streaming
const SCROLL_THRESHOLD = 300;

export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  ({ children, autoScroll = true }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isFirstScrollRef = useRef(true);
    const isAtBottomRef = useRef(true); // Track if user is at bottom for smart auto-scroll
    const [showScrollButton, setShowScrollButton] = useState(false);
    const prevChildCountRef = useRef(0);

    const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
      // Mark as at bottom before scrolling to prevent race conditions
      // during streaming when content grows faster than scroll updates
      isAtBottomRef.current = true;
      setShowScrollButton(false);

      // First scroll is instant, subsequent scrolls are smooth
      const scrollBehavior =
        behavior ?? (isFirstScrollRef.current ? 'instant' : 'smooth');
      bottomRef.current?.scrollIntoView({ behavior: scrollBehavior });
      isFirstScrollRef.current = false;
    }, []);

    const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
      containerRef.current?.scrollTo({ top: 0, behavior });
    }, []);

    // Check if user is at the bottom of the scroll container
    const checkScrollPosition = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= SCROLL_THRESHOLD;

      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToTop,
    }));

    // Listen for scroll events
    useEffect(() => {
      const container = containerRef.current;
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

    useEffect(() => {
      const childCount = Children.count(children);

      // Detect initial content load (e.g., opening an existing chat)
      // When going from 0 to multiple children, this is a fresh load, not streaming
      // In this case, always scroll to bottom regardless of isAtBottomRef
      const isInitialLoad = prevChildCountRef.current === 0 && childCount > 0;

      if (isInitialLoad) {
        // Reset scroll state for fresh load
        isAtBottomRef.current = true;
        isFirstScrollRef.current = true;
        setShowScrollButton(false);
        // Use requestAnimationFrame to ensure DOM is ready before scrolling
        requestAnimationFrame(() => {
          scrollToBottom('instant');
        });
      } else if (autoScroll && isAtBottomRef.current) {
        scrollToBottom('instant');
      }

      prevChildCountRef.current = childCount;
    }, [children, autoScroll, scrollToBottom]);

    const handleScrollButtonClick = useCallback(() => {
      isAtBottomRef.current = true; // Re-enable auto-scroll immediately
      scrollToBottom('smooth');
    }, [scrollToBottom]);

    return (
      <>
        <div
          ref={containerRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-6 scrollbar-thin'
          )}
        >
          <div className="max-w-3xl mx-auto px-4 space-y-6 min-w-0">
            {children}
          </div>
          <div ref={bottomRef} aria-hidden="true" />
        </div>

        {/* Scroll to bottom button - positioned above the input area */}
        <div className="relative h-0">
          <button
            type="button"
            onClick={handleScrollButtonClick}
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
