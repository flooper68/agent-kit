/**
 * Represents a file with path and content
 */
export interface FileItem {
  path: string;
  content: string;
}

/**
 * Represents a node in the file tree (either a file or directory)
 */
export interface FileTreeNode {
  /** Display name (e.g., "api.md" or "references") */
  name: string;
  /** Full path from root (e.g., "references/api.md") */
  path: string;
  /** Whether this node is a directory */
  isDirectory: boolean;
  /** File content (only for file nodes) */
  content?: string;
  /** Child nodes (only for directory nodes) */
  children: FileTreeNode[];
}
