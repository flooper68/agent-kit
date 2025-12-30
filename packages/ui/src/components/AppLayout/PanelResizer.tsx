import { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useAppLayout } from './AppLayout';
import type { PanelResizerProps } from './types';

export const PanelResizer = ({
  onResizeStart,
  onResizeEnd,
}: PanelResizerProps) => {
  const {
    panelCollapsed,
    panelWidth,
    setPanelWidth,
    panelConfig,
    setIsResizing,
  } = useAppLayout();
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (panelCollapsed) return;

      e.preventDefault();
      setIsDragging(true);
      setIsResizing(true);
      onResizeStart?.();
    },
    [panelCollapsed, onResizeStart, setIsResizing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = e.clientX;
      const clampedWidth = Math.min(
        Math.max(newWidth, panelConfig.minWidth),
        panelConfig.maxWidth
      );
      setPanelWidth(clampedWidth);
    },
    [isDragging, panelConfig.minWidth, panelConfig.maxWidth, setPanelWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setIsResizing(false);
      onResizeEnd?.();
    }
  }, [isDragging, onResizeEnd, setIsResizing]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Don't render if panel is collapsed
  if (panelCollapsed) {
    return null;
  }

  return (
    <div
      className="w-1 cursor-col-resize flex-shrink-0 relative group"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize panel (current width: ${panelWidth}px)`}
      aria-valuenow={panelWidth}
      aria-valuemin={panelConfig.minWidth}
      aria-valuemax={panelConfig.maxWidth}
    >
      {/* Visual handle - only visible on hover or while dragging */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-1 h-8 rounded-full',
          'opacity-0 group-hover:opacity-100',
          'bg-primary/60',
          'transition-opacity',
          isDragging && 'opacity-100'
        )}
      />
    </div>
  );
};

PanelResizer.displayName = 'PanelResizer';
