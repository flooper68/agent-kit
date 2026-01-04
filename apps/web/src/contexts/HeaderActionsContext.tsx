import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface HeaderAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface HeaderActionsContextValue {
  actions: HeaderAction[];
  menuItems: HeaderMenuItem[];
  setActions: (actions: HeaderAction[]) => void;
  setMenuItems: (items: HeaderMenuItem[]) => void;
  clearActions: () => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextValue | null>(
  null
);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<HeaderAction[]>([]);
  const [menuItems, setMenuItemsState] = useState<HeaderMenuItem[]>([]);

  const setActions = useCallback((newActions: HeaderAction[]) => {
    setActionsState(newActions);
  }, []);

  const setMenuItems = useCallback((items: HeaderMenuItem[]) => {
    setMenuItemsState(items);
  }, []);

  const clearActions = useCallback(() => {
    setActionsState([]);
    setMenuItemsState([]);
  }, []);

  return (
    <HeaderActionsContext.Provider
      value={{ actions, menuItems, setActions, setMenuItems, clearActions }}
    >
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  const context = useContext(HeaderActionsContext);
  if (!context) {
    throw new Error(
      'useHeaderActions must be used within HeaderActionsProvider'
    );
  }
  return context;
}
