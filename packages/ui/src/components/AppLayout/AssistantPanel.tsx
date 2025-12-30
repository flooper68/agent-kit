import { cn } from '../../lib/utils';
import { useAppLayout } from './AppLayout';
import type { AssistantPanelProps } from './types';

export const AssistantPanel = ({ children }: AssistantPanelProps) => {
  const { panelCollapsed, panelWidth, isResizing } = useAppLayout();

  return (
    <div
      className={cn(
        'h-full overflow-hidden',
        !isResizing && 'transition-[width] duration-300 ease-in-out',
        'border-r border-border bg-background',
        panelCollapsed && 'border-r-0'
      )}
      style={{ width: panelCollapsed ? 0 : panelWidth }}
    >
      {/* Inner container maintains full width for content */}
      <div className="h-full overflow-hidden" style={{ width: panelWidth }}>
        {children}
      </div>
    </div>
  );
};

AssistantPanel.displayName = 'AssistantPanel';
