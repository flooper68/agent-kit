import type { FileItem, FileTreeNode } from './types';

/**
 * Build a tree structure from a flat list of files with paths.
 *
 * Example:
 * Input: [{ path: "SKILL.md", content: "..." }, { path: "refs/api.md", content: "..." }]
 * Output: [
 *   { name: "SKILL.md", path: "SKILL.md", isDirectory: false, content: "...", children: [] },
 *   { name: "refs", path: "refs", isDirectory: true, children: [
 *     { name: "api.md", path: "refs/api.md", isDirectory: false, content: "...", children: [] }
 *   ]}
 * ]
 */
export function buildFileTree(files: FileItem[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  // Sort files for consistent ordering (directories first, then alphabetically)
  const sortedFiles = [...files].sort((a, b) => {
    const aDepth = a.path.split('/').length;
    const bDepth = b.path.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.path.localeCompare(b.path);
  });

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === parts.length - 1;

      // Find existing node at this level
      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        // Create new node
        const newNode: FileTreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLastPart,
          content: isLastPart ? file.content : undefined,
          children: [],
        };
        currentLevel.push(newNode);
        existingNode = newNode;
      } else if (isLastPart) {
        // Update existing directory to be a file if this is the file
        existingNode.content = file.content;
        existingNode.isDirectory = false;
      }

      currentLevel = existingNode.children;
    }
  }

  // Sort the final tree: directories first, then alphabetically
  return sortTree(root);
}

/**
 * Recursively sort tree nodes: directories first, then alphabetically
 */
function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .sort((a, b) => {
      // Directories first
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      // Then alphabetically
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: sortTree(node.children),
    }));
}

/**
 * Flatten a tree back to a list of paths (useful for getting all paths)
 */
export function flattenTree(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];

  function traverse(node: FileTreeNode) {
    paths.push(node.path);
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return paths;
}

/**
 * Get all directory paths from a tree (for expand all functionality)
 */
export function getDirectoryPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];

  function traverse(node: FileTreeNode) {
    if (node.isDirectory) {
      paths.push(node.path);
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return paths;
}
