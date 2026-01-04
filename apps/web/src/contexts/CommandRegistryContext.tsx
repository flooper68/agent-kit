import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { Command } from '@agent-kit/ui';

type RegisteredCommand = Omit<Command, 'onSelect'> & {
  onSelect: () => void;
};

interface CommandRegistryContextValue {
  commands: RegisteredCommand[];
  registerCommand: (command: RegisteredCommand) => void;
  unregisterCommand: (id: string) => void;
}

const CommandRegistryContext = createContext<
  CommandRegistryContextValue | undefined
>(undefined);

export function CommandRegistryProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<RegisteredCommand[]>([]);

  const registerCommand = useCallback((command: RegisteredCommand) => {
    setCommands((prev) => {
      // Replace if exists, otherwise add
      const filtered = prev.filter((c) => c.id !== command.id);
      return [...filtered, command];
    });
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({ commands, registerCommand, unregisterCommand }),
    [commands, registerCommand, unregisterCommand]
  );

  return (
    <CommandRegistryContext.Provider value={value}>
      {children}
    </CommandRegistryContext.Provider>
  );
}

export function useCommandRegistry() {
  const context = useContext(CommandRegistryContext);
  if (!context) {
    throw new Error(
      'useCommandRegistry must be used within a CommandRegistryProvider'
    );
  }
  return context;
}

/**
 * Hook to register a command when a component mounts and unregister on unmount.
 * The command will be available in the command palette while the component is mounted.
 */
export function useRegisterCommand(
  command: RegisteredCommand | null | undefined
) {
  const { registerCommand, unregisterCommand } = useCommandRegistry();

  useEffect(() => {
    if (!command) return;

    registerCommand(command);
    return () => {
      unregisterCommand(command.id);
    };
  }, [command, registerCommand, unregisterCommand]);
}
