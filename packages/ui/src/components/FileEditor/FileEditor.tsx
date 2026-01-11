import { forwardRef, useState } from 'react';
import { FileText, Pencil, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MarkdownRenderer } from '../Chat/CodeDisplay/MarkdownRenderer';

export interface FileEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The file path being edited */
  path: string;
  /** The file content */
  content: string;
  /** Callback when content changes */
  onContentChange: (content: string) => void;
  /** Callback when editor loses focus */
  onBlur?: () => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Placeholder text for empty content */
  placeholder?: string;
}

/**
 * FileEditor component provides a simple interface for editing file content.
 * Shows the file path as a header and a textarea for content editing.
 */
export const FileEditor = forwardRef<HTMLDivElement, FileEditorProps>(
  (
    {
      path,
      content,
      onContentChange,
      onBlur,
      disabled = false,
      placeholder = 'Enter file content...',
      className,
      ...props
    },
    ref
  ) => {
    const isMarkdown = path.endsWith('.md');
    const [isEditing, setIsEditing] = useState(!isMarkdown);

    return (
      <div
        ref={ref}
        className={cn('flex h-full flex-col', className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">{path}</span>
          {isMarkdown && !disabled && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={isEditing ? 'Preview' : 'Edit'}
            >
              {isEditing ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Content - markdown preview or editor */}
        {isMarkdown && !isEditing ? (
          <div className="flex-1 overflow-auto p-4">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && isMarkdown) {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'flex-1 resize-none bg-transparent p-4 font-mono text-sm outline-none',
              'placeholder:text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />
        )}
      </div>
    );
  }
);

FileEditor.displayName = 'FileEditor';
