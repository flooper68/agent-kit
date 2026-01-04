import { forwardRef, memo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../../../../lib/utils';

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

interface CopyButtonProps {
  content: string;
}

const CopyButton = memo(({ content }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <svg
          className="h-4 w-4 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-gray-400 hover:text-gray-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
});

CopyButton.displayName = 'CodeCopyButton';

interface CodeBlockProps {
  children: string;
  language?: string;
  isDark: boolean;
}

const CodeBlock = memo(({ children, language, isDark }: CodeBlockProps) => {
  const style = isDark ? oneDark : oneLight;

  return (
    <div className="not-prose relative group rounded-lg overflow-hidden my-1.5 w-full">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-code-header border-b border-code-border">
        <span className="text-xs font-mono text-muted-foreground">
          {language || 'text'}
        </span>
        <CopyButton content={children} />
      </div>
      {/* Code content with horizontal scroll */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={style}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'hsl(var(--code-background))',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono)',
            },
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

export const MarkdownRenderer = memo(
  forwardRef<HTMLDivElement, MarkdownRendererProps>(
    ({ content, className, ...props }, ref) => {
      // Detect dark mode
      const isDark =
        typeof window !== 'undefined' &&
        document.documentElement.classList.contains('dark');

      return (
        <div ref={ref} className={cn(proseClasses, className)} {...props}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...codeProps }) {
                const match = /language-(\w+)/.exec(className || '');
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

                // Code block with syntax highlighting
                const codeString = String(children).replace(/\n$/, '');
                return (
                  <CodeBlock language={match?.[1]} isDark={isDark}>
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
