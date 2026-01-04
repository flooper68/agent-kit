import { forwardRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../../../lib/utils';
import { useTheme } from '../../../../theme';
import { CodeBlock } from '../CodeBlock';
import { MermaidDiagram } from '../MermaidDiagram';

export interface MarkdownRendererProps
  extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

// Default styling for markdown prose - uses theme colors
// Uses text-base and leading-relaxed to match chat message styling
const proseClasses = `
  prose prose-sm dark:prose-invert max-w-none
  overflow-hidden break-words text-sm leading-normal
  prose-headings:text-foreground prose-headings:font-semibold
  prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
  prose-p:text-foreground prose-p:my-1.5 prose-p:leading-normal
  prose-ul:my-1.5 prose-ol:my-1.5 prose-li:text-foreground
  prose-li:my-0
  prose-strong:text-foreground prose-strong:font-semibold
  prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
  prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-transparent prose-pre:p-0
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all
  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
  prose-hr:border-border prose-hr:my-4
`;

export const MarkdownRenderer = memo(
  forwardRef<HTMLDivElement, MarkdownRendererProps>(
    ({ content, className, ...props }, ref) => {
      // Use theme context for reactive dark mode detection
      const { resolvedTheme } = useTheme();
      const isDark = resolvedTheme === 'dark';

      return (
        <div ref={ref} className={cn(proseClasses, className)} {...props}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...codeProps }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match?.[1];
                // Check if inline: either no parent pre element, or content has no newlines
                const codeContent = String(children);
                const hasNewlines = codeContent.includes('\n');
                const isInline = !hasNewlines && !match;

                if (isInline) {
                  // Inline code
                  return (
                    <code className={className} {...codeProps}>
                      {children}
                    </code>
                  );
                }

                const codeString = String(children).replace(/\n$/, '');

                // Handle mermaid diagrams
                if (language === 'mermaid') {
                  return <MermaidDiagram chart={codeString} />;
                }

                // Code block with syntax highlighting
                return (
                  <CodeBlock language={language} isDark={isDark}>
                    {codeString}
                  </CodeBlock>
                );
              },
              pre({ children }) {
                // Just render children directly, CodeBlock handles the wrapper
                return <>{children}</>;
              },
              table({ children }) {
                // Wrap tables in scrollable container
                return (
                  <div className="overflow-x-auto my-2">
                    <table>{children}</table>
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
  )
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
