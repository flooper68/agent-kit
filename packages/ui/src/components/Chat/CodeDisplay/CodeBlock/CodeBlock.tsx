import { memo, useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

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

export interface CodeBlockProps {
  children: string;
  language?: string;
  isDark: boolean;
}

export const CodeBlock = memo(
  ({ children, language, isDark }: CodeBlockProps) => {
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
  }
);

CodeBlock.displayName = 'CodeBlock';
