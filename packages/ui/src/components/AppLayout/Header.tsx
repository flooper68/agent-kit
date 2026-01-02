import { PanelLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';
import { MainMenu } from './MainMenu';
import { MoreMenu } from './MoreMenu';
import { useAppLayout } from './AppLayout';
import type { HeaderProps } from './types';

export const Header = ({ mainMenu, moreMenu, slots }: HeaderProps) => {
  const { panelCollapsed, panelWidth, togglePanel, isResizing, hasPanel } =
    useAppLayout();

  return (
    <header
      className={cn(
        'h-12 border-b border-border bg-background',
        'flex items-center'
      )}
    >
      {/* Left Zone: Main Menu + Project Switcher + Tool Buttons + Panel Toggle */}
      {/* Width aligns with assistant panel below (when panel exists) */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 h-full',
          hasPanel &&
            !isResizing &&
            'transition-[width] duration-300 ease-in-out'
        )}
        style={{
          width: !hasPanel || panelCollapsed ? 'auto' : panelWidth,
        }}
      >
        <MainMenu config={mainMenu} />

        {slots?.projectSwitcher && (
          <>
            <span className="text-muted-foreground/50 text-lg">/</span>
            {slots.projectSwitcher}
          </>
        )}

        {/* Spacer to push tool buttons and toggle to right edge */}
        <div className="flex-1" />

        {slots?.toolButtons && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <div className="flex items-center gap-1">{slots.toolButtons}</div>
          </>
        )}

        {hasPanel && (
          <Tooltip content={panelCollapsed ? 'Show panel' : 'Hide panel'}>
            <IconButton
              icon={<PanelLeft className="h-4 w-4" />}
              label={panelCollapsed ? 'Show panel' : 'Hide panel'}
              onClick={togglePanel}
              variant="ghost"
              size="sm"
              aria-expanded={!panelCollapsed}
            />
          </Tooltip>
        )}
      </div>

      {/* Main Content Header Area - status centered within this */}
      <div className="flex-1 flex items-center h-full relative">
        {/* Navigation (left-aligned within main content area) */}
        {slots?.navigation && (
          <div className="flex items-center px-2">{slots.navigation}</div>
        )}

        {/* Status (centered in main content area) */}
        {slots?.status && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            {slots.status}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Zone: More Menu + Actions */}
        <div className="flex items-center gap-2 px-2">
          {moreMenu && moreMenu.items.length > 0 && (
            <MoreMenu config={moreMenu} />
          )}
          {slots?.secondaryAction}
          {slots?.primaryAction}
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';
