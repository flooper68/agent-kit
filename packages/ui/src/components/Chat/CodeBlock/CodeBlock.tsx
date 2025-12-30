import { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { CopyButton } from '../CopyButton';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlighter?: (
    code: string,
    language: string
  ) => React.ReactNode | Promise<React.ReactNode>;
}

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      language = 'plaintext',
      filename,
      showLineNumbers = true,
      className,
      ...props
    },
    ref
  ) => {
    const lines = code.split('\n');

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-zinc-950 text-zinc-50 overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {filename && <span className="font-mono">{filename}</span>}
            {!filename && language !== 'plaintext' && (
              <span className="font-mono">{language}</span>
            )}
          </div>
          <CopyButton
            content={code}
            className="text-zinc-400 hover:text-zinc-100"
          />
        </div>

        {/* Code */}
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm font-mono">
            {showLineNumbers ? (
              <table className="border-collapse">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="pr-4 text-zinc-500 select-none text-right w-8">
                        {i + 1}
                      </td>
                      <td className="whitespace-pre">{line || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code>{code}</code>
            )}
          </pre>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';
