import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function useGlobalKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check if the key matches (case-insensitive)
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifier keys
      if (options.metaKey && !e.metaKey) return;
      if (options.ctrlKey && !e.ctrlKey) return;
      if (options.shiftKey && !e.shiftKey) return;
      if (options.altKey && !e.altKey) return;

      // Prevent default (e.g., browser print dialog for Cmd+P)
      e.preventDefault();
      callback();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    key,
    callback,
    options.metaKey,
    options.ctrlKey,
    options.shiftKey,
    options.altKey,
  ]);
}
