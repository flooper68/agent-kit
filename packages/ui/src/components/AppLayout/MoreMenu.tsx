import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';
import type { MoreMenuProps, MenuItem } from './types';

const MenuItemButton = ({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) => {
  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
      onClose();
    }
  };

  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded',
        'hover:bg-muted transition-colors text-left',
        item.disabled && 'opacity-50 cursor-not-allowed',
        item.danger && 'text-destructive hover:bg-destructive/10'
      )}
      onClick={handleClick}
      disabled={item.disabled}
    >
      {item.icon && <span className="h-4 w-4">{item.icon}</span>}
      <span>{item.label}</span>
    </button>
  );
};

export const MoreMenu = ({ config }: MoreMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleClose = () => setIsOpen(false);

  if (!config?.items.length) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <Tooltip content="More actions">
        <IconButton
          icon={<MoreHorizontal className="h-4 w-4" />}
          label="More actions"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        />
      </Tooltip>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'w-44 rounded-md border border-border bg-background shadow-lg',
            'animate-fade-in p-1'
          )}
          role="menu"
        >
          {config.items.map((item) => (
            <MenuItemButton key={item.id} item={item} onClose={handleClose} />
          ))}
        </div>
      )}
    </div>
  );
};

MoreMenu.displayName = 'MoreMenu';
