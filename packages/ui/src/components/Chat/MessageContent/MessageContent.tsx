import { forwardRef, memo } from 'react';
import { cn } from '../../../lib/utils';
import type { MessagePart } from '../../../types/chat';

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  parts: MessagePart[];
  renderPart?: (part: MessagePart) => React.ReactNode;
}

// Default text renderer - consumers can override with react-markdown
const DefaultTextContent = ({ content }: { content: string }) => (
  <div className="whitespace-pre-wrap break-words">{content}</div>
);

export const MessageContent = memo(
  forwardRef<HTMLDivElement, MessageContentProps>(
    ({ parts, renderPart, className, ...props }, ref) => {
      const defaultRenderPart = (part: MessagePart): React.ReactNode => {
        switch (part.type) {
          case 'text':
            return <DefaultTextContent key={part.id} content={part.content} />;
          case 'tool_invocation':
            // Placeholder - use ToolCallDisplay component
            return (
              <div
                key={part.id}
                className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
              >
                Tool: {part.toolName}
              </div>
            );
          case 'tool_result':
            return (
              <div
                key={part.id}
                className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
              >
                Result: {typeof part.result === 'string' ? part.result : 'Done'}
              </div>
            );
          case 'reasoning':
            // Placeholder - use ReasoningDisplay component
            return (
              <div
                key={part.id}
                className="text-xs italic text-muted-foreground"
              >
                Thinking...
              </div>
            );
          case 'image':
            return (
              <img
                key={part.id}
                src={part.url}
                alt={part.alt ?? 'Image'}
                className="max-w-full rounded-lg"
              />
            );
          case 'file':
            return (
              <div
                key={part.id}
                className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {part.name}
              </div>
            );
          default:
            return null;
        }
      };

      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {parts.map((part) => (renderPart ?? defaultRenderPart)(part))}
        </div>
      );
    }
  )
);

MessageContent.displayName = 'MessageContent';
