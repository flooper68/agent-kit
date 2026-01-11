import { useState, useMemo, forwardRef, useCallback } from 'react';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FileItem, FileTreeNode } from './types';
import { buildFileTree, getDirectoryPaths } from './utils';

export interface FileTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of files with path and content */
  files: FileItem[];
  /** Paths of initially expanded nodes */
  defaultExpanded?: string[];
  /** Whether to show file content when a file is clicked */
  showFileContent?: boolean;
  /** Callback when a file is selected */
  onFileSelect?: (file: FileItem) => void;
  /** Custom render function for file content */
  renderFileContent?: (file: FileItem) => React.ReactNode;
}

/**
 * FileTree component displays files in a hierarchical tree structure.
 * Supports nested directories, expand/collapse, and file content preview.
 */
export const FileTree = forwardRef<HTMLDivElement, FileTreeProps>(
  (
    {
      files,
      defaultExpanded = [],
      showFileContent = true,
      onFileSelect,
      renderFileContent,
      className,
      ...props
    },
    ref
  ) => {
    // Track expanded directories and files showing content
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
      () => new Set(defaultExpanded)
    );
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    // Build tree structure from flat files
    const tree = useMemo(() => buildFileTree(files), [files]);

    const toggleDir = useCallback((path: string) => {
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }, []);

    const toggleFile = useCallback(
      (path: string, file: FileItem) => {
        if (showFileContent) {
          setExpandedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
              next.delete(path);
            } else {
              next.add(path);
            }
            return next;
          });
        }
        onFileSelect?.(file);
      },
      [showFileContent, onFileSelect]
    );

    const expandAll = useCallback(() => {
      const allDirs = getDirectoryPaths(tree);
      setExpandedDirs(new Set(allDirs));
    }, [tree]);

    const collapseAll = useCallback(() => {
      setExpandedDirs(new Set());
      setExpandedFiles(new Set());
    }, []);

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {/* Controls */}
        <div className="mb-2 flex gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
        </div>

        {/* Tree */}
        <div className="rounded-lg border">
          {tree.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No files
            </div>
          ) : (
            <div className="divide-y">
              {tree.map((node) => (
                <FileTreeNodeComponent
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedDirs={expandedDirs}
                  expandedFiles={expandedFiles}
                  onToggleDir={toggleDir}
                  onToggleFile={toggleFile}
                  showFileContent={showFileContent}
                  renderFileContent={renderFileContent}
                  files={files}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

FileTree.displayName = 'FileTree';

interface FileTreeNodeComponentProps {
  node: FileTreeNode;
  depth: number;
  expandedDirs: Set<string>;
  expandedFiles: Set<string>;
  onToggleDir: (path: string) => void;
  onToggleFile: (path: string, file: FileItem) => void;
  showFileContent: boolean;
  renderFileContent?: (file: FileItem) => React.ReactNode;
  files: FileItem[];
}

function FileTreeNodeComponent({
  node,
  depth,
  expandedDirs,
  expandedFiles,
  onToggleDir,
  onToggleFile,
  showFileContent,
  renderFileContent,
  files,
}: FileTreeNodeComponentProps) {
  const isExpanded = node.isDirectory
    ? expandedDirs.has(node.path)
    : expandedFiles.has(node.path);

  const file = files.find((f) => f.path === node.path);

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleDir(node.path);
    } else if (file) {
      onToggleFile(node.path, file);
    }
  };

  return (
    <div>
      {/* Node row */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50',
          depth > 0 && 'border-l border-muted'
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {/* Expand/collapse indicator */}
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            isExpanded && 'rotate-90',
            !node.isDirectory && !showFileContent && 'invisible'
          )}
        />

        {/* Icon */}
        {node.isDirectory ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
          )
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Name */}
        <span className="truncate">{node.name}</span>
      </button>

      {/* Directory children */}
      {node.isDirectory && isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <FileTreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedDirs={expandedDirs}
              expandedFiles={expandedFiles}
              onToggleDir={onToggleDir}
              onToggleFile={onToggleFile}
              showFileContent={showFileContent}
              renderFileContent={renderFileContent}
              files={files}
            />
          ))}
        </div>
      )}

      {/* File content */}
      {!node.isDirectory && isExpanded && file && showFileContent && (
        <div
          className="border-t bg-muted/30 p-4"
          style={{ marginLeft: `${depth * 16}px` }}
        >
          {renderFileContent ? (
            renderFileContent(file)
          ) : (
            <FileContentDefault content={file.content} />
          )}
        </div>
      )}
    </div>
  );
}

interface FileContentDefaultProps {
  content: string;
}

function FileContentDefault({ content }: FileContentDefaultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto text-sm">
        <code>{content}</code>
      </pre>
    </div>
  );
}
