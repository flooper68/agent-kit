import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { cn } from '../../../../lib/utils';

export interface MessageListProps {
  children: React.ReactNode;
  autoScroll?: boolean;
}

export interface MessageListRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  scrollToTop: (behavior?: ScrollBehavior) => void;
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  ({ children, autoScroll = true }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isFirstScrollRef = useRef(true);

    const scrollToBottom = (behavior?: ScrollBehavior) => {
      // First scroll is instant, subsequent scrolls are smooth
      const scrollBehavior =
        behavior ?? (isFirstScrollRef.current ? 'instant' : 'smooth');
      bottomRef.current?.scrollIntoView({ behavior: scrollBehavior });
      isFirstScrollRef.current = false;
    };

    const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
      containerRef.current?.scrollTo({ top: 0, behavior });
    };

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToTop,
    }));

    useEffect(() => {
      if (autoScroll) {
        scrollToBottom();
      }
    }, [children, autoScroll]);

    return (
      <div
        ref={containerRef}
        className={cn('flex-1 overflow-y-auto px-4 py-6 space-y-4')}
      >
        {children}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
