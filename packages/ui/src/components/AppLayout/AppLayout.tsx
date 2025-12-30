import {
  forwardRef,
  useState,
  useImperativeHandle,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { cn } from '../../lib/utils';
import { Header } from './Header';
import { AssistantPanel } from './AssistantPanel';
import { PanelResizer } from './PanelResizer';
import type {
  AppLayoutProps,
  AppLayoutRef,
  AppLayoutContextValue,
  PanelConfig,
} from './types';

const DEFAULT_PANEL_CONFIG: Required<PanelConfig> = {
  defaultWidth: 400,
  minWidth: 280,
  maxWidth: 600,
  defaultCollapsed: false,
};

const AppLayoutContext = createContext<AppLayoutContextValue | undefined>(
  undefined
);

export const useAppLayout = () => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayout must be used within an AppLayout');
  }
  return context;
};

export const AppLayout = forwardRef<AppLayoutRef, AppLayoutProps>(
  (
    {
      mainMenu,
      moreMenu,
      headerSlots,
      panelConfig: panelConfigProp,
      assistantPanel,
      children,
      className,
      panelCollapsed: controlledCollapsed,
      onPanelCollapsedChange,
      panelWidth: controlledWidth,
      onPanelWidthChange,
    },
    ref
  ) => {
    const panelConfig = useMemo(
      () => ({
        ...DEFAULT_PANEL_CONFIG,
        ...panelConfigProp,
      }),
      [panelConfigProp]
    );

    const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(
      panelConfig.defaultCollapsed
    );
    const [uncontrolledWidth, setUncontrolledWidth] = useState(
      panelConfig.defaultWidth
    );
    const [isResizing, setIsResizing] = useState(false);

    const isCollapsed = controlledCollapsed ?? uncontrolledCollapsed;
    const width = controlledWidth ?? uncontrolledWidth;

    const setPanelCollapsed = useCallback(
      (collapsed: boolean) => {
        setUncontrolledCollapsed(collapsed);
        onPanelCollapsedChange?.(collapsed);
      },
      [onPanelCollapsedChange]
    );

    const setPanelWidth = useCallback(
      (newWidth: number) => {
        const clampedWidth = Math.min(
          Math.max(newWidth, panelConfig.minWidth),
          panelConfig.maxWidth
        );
        setUncontrolledWidth(clampedWidth);
        onPanelWidthChange?.(clampedWidth);
      },
      [panelConfig.minWidth, panelConfig.maxWidth, onPanelWidthChange]
    );

    const togglePanel = useCallback(() => {
      setPanelCollapsed(!isCollapsed);
    }, [setPanelCollapsed, isCollapsed]);

    useImperativeHandle(
      ref,
      () => ({
        collapsePanel: () => setPanelCollapsed(true),
        expandPanel: () => setPanelCollapsed(false),
        togglePanel,
        setPanelWidth,
      }),
      [setPanelCollapsed, togglePanel, setPanelWidth]
    );

    const contextValue = useMemo<AppLayoutContextValue>(
      () => ({
        panelCollapsed: isCollapsed,
        setPanelCollapsed,
        togglePanel,
        panelWidth: width,
        setPanelWidth,
        panelConfig,
        isResizing,
        setIsResizing,
      }),
      [
        isCollapsed,
        setPanelCollapsed,
        togglePanel,
        width,
        setPanelWidth,
        panelConfig,
        isResizing,
      ]
    );

    return (
      <AppLayoutContext.Provider value={contextValue}>
        <div
          className={cn(
            'h-full grid grid-rows-[auto_1fr] bg-background',
            className
          )}
        >
          <Header mainMenu={mainMenu} moreMenu={moreMenu} slots={headerSlots} />
          <div className="flex flex-1 overflow-hidden">
            {assistantPanel && (
              <>
                <AssistantPanel>{assistantPanel}</AssistantPanel>
                <PanelResizer />
              </>
            )}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </AppLayoutContext.Provider>
    );
  }
);

AppLayout.displayName = 'AppLayout';
