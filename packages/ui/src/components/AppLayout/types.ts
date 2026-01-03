import type { ReactNode } from 'react';

// Menu item types
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}

export interface MenuSection {
  id: string;
  label?: string;
  items: MenuItem[];
}

// Main menu configuration
export interface MainMenuConfig {
  /** App/workspace name displayed in the menu trigger */
  appName?: string;
  /** App icon displayed in the menu trigger */
  appIcon?: ReactNode;
  /** Branding section at top of menu dropdown */
  branding?: {
    logo?: ReactNode;
    name?: string;
    tagline?: string;
  };
  /** User profile section */
  profile?: {
    name?: string;
    email?: string;
    avatarSrc?: string;
    avatarFallback?: string;
  };
  /** Include theme toggle in menu */
  showThemeToggle?: boolean;
  /** Custom menu sections */
  sections?: MenuSection[];
  /** Sign out handler */
  onSignOut?: () => void;
}

// More menu configuration
export interface MoreMenuConfig {
  items: MenuItem[];
}

// Panel configuration
export interface PanelConfig {
  /** Default width in pixels */
  defaultWidth?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Whether panel starts collapsed */
  defaultCollapsed?: boolean;
}

// Header slot props
export interface HeaderSlots {
  /** Slot for project/workspace switcher (after main menu) */
  projectSwitcher?: ReactNode;
  /** Slot after panel toggle, for tool buttons */
  toolButtons?: ReactNode;
  /** Slot for navigation/tabs (center-left) */
  navigation?: ReactNode;
  /** Slot for status info (center) */
  status?: ReactNode;
  /** Primary action button slot (right) */
  primaryAction?: ReactNode;
  /** Secondary action button slot (right) */
  secondaryAction?: ReactNode;
}

// Main AppLayout props
export interface AppLayoutProps {
  /** Main menu configuration */
  mainMenu?: MainMenuConfig;
  /** More menu configuration */
  moreMenu?: MoreMenuConfig;
  /** Header slots for custom content */
  headerSlots?: HeaderSlots;
  /** Panel configuration */
  panelConfig?: PanelConfig;
  /** Content for the assistant panel (left) */
  assistantPanel?: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Controlled collapsed state */
  panelCollapsed?: boolean;
  /** Callback when panel collapsed state changes */
  onPanelCollapsedChange?: (collapsed: boolean) => void;
  /** Controlled panel width */
  panelWidth?: number;
  /** Callback when panel width changes */
  onPanelWidthChange?: (width: number) => void;
}

// Context value
export interface AppLayoutContextValue {
  panelCollapsed: boolean;
  setPanelCollapsed: (collapsed: boolean) => void;
  togglePanel: () => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  panelConfig: Required<PanelConfig>;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  hasPanel: boolean;
}

// Ref handle
export interface AppLayoutRef {
  collapsePanel: () => void;
  expandPanel: () => void;
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
}

// Internal component props
export interface HeaderProps {
  mainMenu?: MainMenuConfig;
  moreMenu?: MoreMenuConfig;
  slots?: HeaderSlots;
}

export interface AssistantPanelProps {
  children?: ReactNode;
}

export interface PanelResizerProps {
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export interface MainMenuProps {
  config?: MainMenuConfig;
}

export interface MoreMenuProps {
  config?: MoreMenuConfig;
}
