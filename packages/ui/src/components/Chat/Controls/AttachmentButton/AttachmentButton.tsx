import { forwardRef, useRef, useState } from 'react';
import { cn } from '../../../../lib/utils';
import { IconButton } from '../../../IconButton';

export type AttachmentType = 'image' | 'file' | 'screenshot';

export interface AttachmentButtonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onAttach?: (files: File[], type: AttachmentType) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  showMenu?: boolean;
}

export const AttachmentButton = forwardRef<
  HTMLDivElement,
  AttachmentButtonProps
>(
  (
    {
      onAttach,
      accept = 'image/*,.pdf,.txt,.md,.json',
      multiple = true,
      disabled,
      showMenu = true,
      className,
      ...props
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        const type = files.every((f) => f.type.startsWith('image/'))
          ? 'image'
          : 'file';
        onAttach?.(files, type);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleClick = () => {
      if (showMenu) {
        setIsMenuOpen(!isMenuOpen);
      } else {
        fileInputRef.current?.click();
      }
    };

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <IconButton
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          }
          label="Attach file"
          onClick={handleClick}
          disabled={disabled}
        />

        {showMenu && isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 z-20 rounded-md border bg-popover shadow-md py-1 min-w-[160px]">
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload image
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  onAttach?.([], 'screenshot');
                  setIsMenuOpen(false);
                }}
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Take screenshot
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
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
                Upload file
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

AttachmentButton.displayName = 'AttachmentButton';
