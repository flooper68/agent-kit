import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';
import { IconButton } from '../../../IconButton';
import type { Attachment } from '../../../../types/chat';

export interface AttachmentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  removable?: boolean;
}

export const AttachmentPreview = forwardRef<
  HTMLDivElement,
  AttachmentPreviewProps
>(({ attachments, onRemove, removable = true, className, ...props }, ref) => {
  if (attachments.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div ref={ref} className={cn('flex flex-wrap gap-2', className)} {...props}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="relative group rounded-lg border bg-muted/50 overflow-hidden"
        >
          {attachment.type === 'image' ? (
            <div className="w-20 h-20">
              <img
                src={attachment.preview ?? attachment.url}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-20 flex flex-col items-center justify-center p-2">
              <svg
                className="h-8 w-8 text-muted-foreground"
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
              <span className="text-xs text-muted-foreground truncate w-full text-center mt-1">
                {attachment.name}
              </span>
              <span className="text-xs text-muted-foreground/75">
                {formatSize(attachment.size)}
              </span>
            </div>
          )}

          {removable && (
            <IconButton
              icon={
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              label="Remove attachment"
              size="sm"
              onClick={() => onRemove?.(attachment.id)}
              className="absolute top-1 right-1 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
      ))}
    </div>
  );
});

AttachmentPreview.displayName = 'AttachmentPreview';
