import {
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
  useCallback,
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
const SCROLL_THRESHOLD = 100;

export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  ({ children, autoScroll = true }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isFirstScrollRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
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
      setShowScrollButton(distanceFromBottom > SCROLL_THRESHOLD);
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
      if (autoScroll) {
        scrollToBottom();
      }
    }, [children, autoScroll, scrollToBottom]);

    const handleScrollButtonClick = useCallback(() => {
      scrollToBottom('smooth');
    }, [scrollToBottom]);

    return (
      <>
        <div
          ref={containerRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin'
          )}
        >
          {children}
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
