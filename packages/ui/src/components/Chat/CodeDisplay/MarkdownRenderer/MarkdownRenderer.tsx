import { forwardRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../../../lib/utils';

export interface MarkdownRendererProps
  extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

// Default styling for markdown prose - uses theme colors
const proseClasses = `
  prose prose-sm max-w-none
  prose-headings:text-foreground prose-headings:font-semibold
  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
  prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed
  prose-ul:my-2 prose-ol:my-2 prose-li:text-foreground
  prose-li:my-0.5
  prose-strong:text-foreground prose-strong:font-semibold
  prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
  prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
  prose-hr:border-border prose-hr:my-4
`;

export const MarkdownRenderer = memo(
  forwardRef<HTMLDivElement, MarkdownRendererProps>(
    ({ content, className, ...props }, ref) => {
      return (
        <div ref={ref} className={cn(proseClasses, className)} {...props}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      );
    }
  )
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
