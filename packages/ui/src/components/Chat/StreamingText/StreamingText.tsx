import { forwardRef, useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

export interface StreamingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  isStreaming?: boolean;
  showCursor?: boolean;
}

export const StreamingText = forwardRef<HTMLSpanElement, StreamingTextProps>(
  (
    { text, isStreaming = false, showCursor = true, className, ...props },
    ref
  ) => {
    const [displayedText, setDisplayedText] = useState(text);

    // For real streaming, just update displayed text directly
    useEffect(() => {
      setDisplayedText(text);
    }, [text]);

    return (
      <span ref={ref} className={cn('', className)} {...props}>
        {displayedText}
        {isStreaming && showCursor && (
          <span className="inline-block w-[2px] h-[1.1em] bg-foreground ml-0.5 animate-blink" />
        )}
      </span>
    );
  }
);

StreamingText.displayName = 'StreamingText';
