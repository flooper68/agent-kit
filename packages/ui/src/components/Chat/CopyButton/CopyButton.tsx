import { forwardRef, useState } from 'react';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../IconButton';

export interface CopyButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  content: string;
  onCopy?: () => void;
  feedbackDuration?: number;
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ content, onCopy, feedbackDuration = 2000, className, ...props }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), feedbackDuration);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return (
      <IconButton
        ref={ref}
        icon={
          copied ? (
            <svg
              className="h-4 w-4 text-green-500"
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
              className="h-4 w-4"
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
          )
        }
        label={copied ? 'Copied!' : 'Copy to clipboard'}
        onClick={handleCopy}
        className={cn(className)}
        {...props}
      />
    );
  }
);

CopyButton.displayName = 'CopyButton';
