import {
  useState,
  useMemo,
  forwardRef,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Trash2,
  Pencil,
  FileQuestion,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FileItem, FileTreeNode } from '../FileTree/types';
import { buildFileTree } from '../FileTree/utils';

export interface EditableFileTreeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of files with path and content */
  files: FileItem[];
  /** Currently selected file path */
  selectedPath: string | null;
  /** Callback when files array changes */
  onFilesChange: (files: FileItem[]) => void;
  /** Callback when a file is selected */
  onFileSelect: (path: string) => void;
  /** Pre-created empty folders to always show */
  defaultFolders?: string[];
  /** Whether the tree is disabled */
  disabled?: boolean;
}

interface NewFileState {
  parentPath: string; // "" for root, "references" for folder
  isActive: boolean;
}

/**
 * EditableFileTree component displays files in a hierarchical tree structure
 * with support for adding, selecting, renaming, and deleting files.
 */
export const EditableFileTree = forwardRef<
  HTMLDivElement,
  EditableFileTreeProps
>(
  (
    {
      files,
      selectedPath,
      onFilesChange,
      onFileSelect,
      defaultFolders = [],
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
      () => new Set(defaultFolders)
    );
    const [newFile, setNewFile] = useState<NewFileState | null>(null);
    const [renamingPath, setRenamingPath] = useState<string | null>(null);

    // Build tree structure from flat files, including empty default folders
    const tree = useMemo(() => {
      const baseTree = buildFileTree(files);

      // Add empty default folders that don't exist yet
      const existingPaths = new Set(baseTree.map((n) => n.path));
      const folderNodes: FileTreeNode[] = [];

      for (const folder of defaultFolders) {
        if (!existingPaths.has(folder)) {
          folderNodes.push({
            name: folder,
            path: folder,
            isDirectory: true,
            children: [],
          });
        }
      }

      // Sort: folders first (alphabetically), then files (alphabetically)
      const allNodes = [...baseTree, ...folderNodes];
      return allNodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return 1; // folders after files at root
        if (!a.isDirectory && b.isDirectory) return -1;
        return a.name.localeCompare(b.name);
      });
    }, [files, defaultFolders]);

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

    const handleAddFile = useCallback((parentPath: string) => {
      // Expand the parent folder if it's a folder
      if (parentPath) {
        setExpandedDirs((prev) => new Set([...prev, parentPath]));
      }
      setNewFile({ parentPath, isActive: true });
    }, []);

    const handleNewFileConfirm = useCallback(
      (filename: string) => {
        if (!newFile || !filename.trim()) {
          setNewFile(null);
          return;
        }

        const fullPath = newFile.parentPath
          ? `${newFile.parentPath}/${filename.trim()}`
          : filename.trim();

        // Check if file already exists
        if (files.some((f) => f.path === fullPath)) {
          setNewFile(null);
          return;
        }

        const newFiles = [...files, { path: fullPath, content: '' }];
        onFilesChange(newFiles);
        onFileSelect(fullPath);
        setNewFile(null);
      },
      [newFile, files, onFilesChange, onFileSelect]
    );

    const handleNewFileCancel = useCallback(() => {
      setNewFile(null);
    }, []);

    const handleDeleteFile = useCallback(
      (path: string) => {
        // Don't allow deleting SKILL.md
        if (path === 'SKILL.md') return;

        const newFiles = files.filter((f) => f.path !== path);
        onFilesChange(newFiles);

        // If deleted file was selected, select SKILL.md
        if (selectedPath === path) {
          const skillMd = files.find((f) => f.path === 'SKILL.md');
          if (skillMd) {
            onFileSelect('SKILL.md');
          }
        }
      },
      [files, selectedPath, onFilesChange, onFileSelect]
    );

    const handleStartRename = useCallback((path: string) => {
      setRenamingPath(path);
    }, []);

    const handleRenameConfirm = useCallback(
      (oldPath: string, newName: string) => {
        if (!newName.trim()) {
          setRenamingPath(null);
          return;
        }

        // Get directory from old path
        const dir = oldPath.includes('/')
          ? oldPath.substring(0, oldPath.lastIndexOf('/'))
          : '';
        const newPath = dir ? `${dir}/${newName.trim()}` : newName.trim();

        // If name didn't change, just cancel
        if (newPath === oldPath) {
          setRenamingPath(null);
          return;
        }

        // Check if new path already exists
        if (files.some((f) => f.path === newPath)) {
          setRenamingPath(null);
          return;
        }

        // Update files array
        const newFiles = files.map((f) =>
          f.path === oldPath ? { ...f, path: newPath } : f
        );
        onFilesChange(newFiles);

        // Update selection if renamed file was selected
        if (selectedPath === oldPath) {
          onFileSelect(newPath);
        }

        setRenamingPath(null);
      },
      [files, selectedPath, onFilesChange, onFileSelect]
    );

    const handleRenameCancel = useCallback(() => {
      setRenamingPath(null);
    }, []);

    return (
      <div ref={ref} className={cn('h-full', className)} {...props}>
        <div className="flex h-full flex-col">
          {/* Header with add button */}
          <div className="flex items-center justify-between bg-muted/30 px-2 py-2">
            <span className="text-sm font-medium">Files</span>
            <button
              type="button"
              onClick={() => handleAddFile('')}
              disabled={disabled || newFile !== null}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              title="Add file"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Tree content */}
          <div className="flex-1 overflow-auto border-t py-1">
            {/* New file input at root level */}
            {newFile?.parentPath === '' && (
              <NewFileInput
                onConfirm={handleNewFileConfirm}
                onCancel={handleNewFileCancel}
                depth={0}
              />
            )}

            {tree.map((node) => (
              <EditableTreeNode
                key={node.path}
                node={node}
                depth={0}
                expandedDirs={expandedDirs}
                selectedPath={selectedPath}
                renamingPath={renamingPath}
                onToggleDir={toggleDir}
                onFileSelect={onFileSelect}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onStartRename={handleStartRename}
                onRenameConfirm={handleRenameConfirm}
                onRenameCancel={handleRenameCancel}
                newFile={newFile}
                onNewFileConfirm={handleNewFileConfirm}
                onNewFileCancel={handleNewFileCancel}
                disabled={disabled}
                defaultFolders={defaultFolders}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

EditableFileTree.displayName = 'EditableFileTree';

interface EditableTreeNodeProps {
  node: FileTreeNode;
  depth: number;
  expandedDirs: Set<string>;
  selectedPath: string | null;
  renamingPath: string | null;
  onToggleDir: (path: string) => void;
  onFileSelect: (path: string) => void;
  onAddFile: (parentPath: string) => void;
  onDeleteFile: (path: string) => void;
  onStartRename: (path: string) => void;
  onRenameConfirm: (oldPath: string, newName: string) => void;
  onRenameCancel: () => void;
  newFile: NewFileState | null;
  onNewFileConfirm: (filename: string) => void;
  onNewFileCancel: () => void;
  disabled: boolean;
  defaultFolders: string[];
}

function EditableTreeNode({
  node,
  depth,
  expandedDirs,
  selectedPath,
  renamingPath,
  onToggleDir,
  onFileSelect,
  onAddFile,
  onDeleteFile,
  onStartRename,
  onRenameConfirm,
  onRenameCancel,
  newFile,
  onNewFileConfirm,
  onNewFileCancel,
  disabled,
  defaultFolders,
}: EditableTreeNodeProps) {
  const isExpanded = node.isDirectory ? expandedDirs.has(node.path) : false;
  const isSelected = !node.isDirectory && selectedPath === node.path;
  const isRenaming = renamingPath === node.path;
  const canDelete = !node.isDirectory && node.path !== 'SKILL.md';

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleDir(node.path);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      {/* Node row */}
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1 text-sm transition-colors',
          isSelected && 'bg-accent',
          !isSelected && 'hover:bg-muted/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isRenaming ? (
          <RenameInput
            currentName={node.name}
            onConfirm={(newName) => onRenameConfirm(node.path, newName)}
            onCancel={onRenameCancel}
            depth={0}
          />
        ) : (
          <>
            {/* Clickable area */}
            <button
              type="button"
              onClick={handleClick}
              disabled={disabled}
              className="flex flex-1 items-center gap-2 text-left disabled:opacity-50"
            >
              {/* Expand/collapse indicator - only for directories */}
              {node.isDirectory && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}

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

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-0.5">
              {/* Add file button for directories - always visible */}
              {node.isDirectory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFile(node.path);
                  }}
                  disabled={disabled || newFile !== null}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  title="Add file"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Rename button for files - hover only */}
              {!node.isDirectory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(node.path);
                  }}
                  disabled={disabled}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                  title="Rename file"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Delete button for files (except SKILL.md) - hover only */}
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(node.path);
                  }}
                  disabled={disabled}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                  title="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Directory children */}
      {node.isDirectory && isExpanded && (
        <div>
          {/* New file input inside folder */}
          {newFile?.parentPath === node.path && (
            <NewFileInput
              onConfirm={onNewFileConfirm}
              onCancel={onNewFileCancel}
              depth={depth + 1}
            />
          )}

          {node.children.length > 0 ? (
            node.children.map((child) => (
              <EditableTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                selectedPath={selectedPath}
                renamingPath={renamingPath}
                onToggleDir={onToggleDir}
                onFileSelect={onFileSelect}
                onAddFile={onAddFile}
                onDeleteFile={onDeleteFile}
                onStartRename={onStartRename}
                onRenameConfirm={onRenameConfirm}
                onRenameCancel={onRenameCancel}
                newFile={newFile}
                onNewFileConfirm={onNewFileConfirm}
                onNewFileCancel={onNewFileCancel}
                disabled={disabled}
                defaultFolders={defaultFolders}
              />
            ))
          ) : newFile?.parentPath !== node.path ? (
            <div
              className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground italic"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <FileQuestion className="h-3.5 w-3.5" />
              <span>Empty folder</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface NewFileInputProps {
  onConfirm: (filename: string) => void;
  onCancel: () => void;
  depth: number;
}

function NewFileInput({ onConfirm, onCancel, depth }: NewFileInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      onConfirm(value);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="flex min-w-0 items-center gap-2 px-2 py-1"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="filename.md"
        className="h-5 min-w-0 flex-1 rounded border bg-background px-1.5 text-sm outline-none focus:border-ring"
      />
    </div>
  );
}

interface RenameInputProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  depth: number;
}

function RenameInput({ currentName, onConfirm, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      onConfirm(value);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-5 min-w-0 flex-1 rounded border bg-background px-1.5 text-sm outline-none focus:border-ring"
      />
    </div>
  );
}
