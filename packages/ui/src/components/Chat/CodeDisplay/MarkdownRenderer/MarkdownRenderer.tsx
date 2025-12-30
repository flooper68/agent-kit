import { forwardRef, memo } from 'react';
import { cn } from '../../../../lib/utils';

// This is a base wrapper - consumers should integrate with react-markdown
export interface MarkdownRendererProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

// Default styling for markdown prose
const proseClasses = `
  prose prose-sm dark:prose-invert max-w-none
  prose-headings:font-semibold
  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
  prose-p:my-2 prose-p:leading-relaxed
  prose-ul:my-2 prose-ol:my-2
  prose-li:my-0.5
  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
  prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-transparent prose-pre:p-0
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
  prose-blockquote:border-l-primary prose-blockquote:not-italic
  prose-hr:my-4
`;

// Placeholder implementation - consumers should use react-markdown for full support
export const MarkdownRenderer = memo(
  forwardRef<HTMLDivElement, MarkdownRendererProps>(
    ({ content, className, ...props }, ref) => {
      return (
        <div ref={ref} className={cn(proseClasses, className)} {...props}>
          {/*
            To enable full markdown rendering, install:
            - react-markdown
            - remark-gfm
            - @tailwindcss/typography

            Then wrap content with ReactMarkdown:

            import ReactMarkdown from 'react-markdown';
            import remarkGfm from 'remark-gfm';

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      code={String(children).replace(/\n$/, '')}
                      language={match[1]}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          */}
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      );
    }
  )
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
