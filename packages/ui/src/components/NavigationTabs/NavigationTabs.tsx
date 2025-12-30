import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

export interface NavigationTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon to display before the label */
  icon?: ReactNode;
  /** Optional tooltip content */
  tooltip?: string;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface NavigationTabsProps {
  /** Array of tabs to display */
  tabs: NavigationTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when a tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Size of the tab buttons */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

export const NavigationTabs = ({
  tabs,
  activeTab,
  onTabChange,
  size = 'sm',
  className,
}: NavigationTabsProps) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {tabs.map((tab) => {
        const button = (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
            size={size}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            {tab.label}
          </Button>
        );

        if (tab.tooltip) {
          return (
            <Tooltip key={tab.id} content={tab.tooltip}>
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
};

NavigationTabs.displayName = 'NavigationTabs';
