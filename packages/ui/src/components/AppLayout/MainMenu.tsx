import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import { useTheme, type Theme } from '../../theme';
import type { MainMenuProps, MenuItem } from './types';

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const nextTheme: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

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
    }
    onClose();
  };

  const className = cn(
    'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded',
    'hover:bg-muted transition-colors text-left',
    item.disabled && 'opacity-50 cursor-not-allowed',
    item.danger && 'text-destructive hover:bg-destructive/10',
    item.active && 'bg-muted font-medium'
  );

  const content = (
    <>
      {item.icon && <span className="h-4 w-4">{item.icon}</span>}
      <span>{item.label}</span>
    </>
  );

  // Render as link if href is provided
  if (item.href) {
    return (
      <a href={item.href} className={className} onClick={onClose}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={item.disabled}
    >
      {content}
    </button>
  );
};

export const MainMenu = ({ config }: MainMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const displayTheme = theme === 'system' ? 'system' : resolvedTheme;

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

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {config?.appIcon && (
          <span className="h-4 w-4 flex items-center justify-center">
            {config.appIcon}
          </span>
        )}
        <span className="font-medium">{config?.appName ?? 'App'}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full mt-1 z-50',
            'w-56 rounded-md border border-border bg-background shadow-lg',
            'animate-fade-in'
          )}
          role="menu"
        >
          {/* Branding Section */}
          {config?.branding && (
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                {config.branding.logo && (
                  <span className="h-6 w-6 flex items-center justify-center">
                    {config.branding.logo}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  {config.branding.name && (
                    <div className="font-semibold text-sm truncate">
                      {config.branding.name}
                    </div>
                  )}
                  {config.branding.tagline && (
                    <div className="text-xs text-muted-foreground truncate">
                      {config.branding.tagline}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Sections */}
          {config?.sections?.map((section) => (
            <div key={section.id} className="px-1 py-1">
              {section.label && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <MenuItemButton
                  key={item.id}
                  item={item}
                  onClose={handleClose}
                />
              ))}
            </div>
          ))}

          {/* Profile Section */}
          {config?.profile && (
            <div className="px-2 py-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Avatar
                  src={config.profile.avatarSrc}
                  fallback={
                    config.profile.avatarFallback ??
                    config.profile.name?.charAt(0).toUpperCase()
                  }
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  {config.profile.name && (
                    <div className="font-medium text-sm truncate">
                      {config.profile.name}
                    </div>
                  )}
                  {config.profile.email && (
                    <div className="text-xs text-muted-foreground truncate">
                      {config.profile.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          {config?.showThemeToggle && (
            <div className="px-1 py-1">
              <button
                type="button"
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-sm rounded',
                  'hover:bg-muted transition-colors'
                )}
                onClick={() => setTheme(nextTheme[theme])}
              >
                <span>Theme</span>
                <span className="h-4 w-4 text-muted-foreground">
                  {themeIcons[displayTheme]}
                </span>
              </button>
            </div>
          )}

          {/* Sign Out */}
          {config?.onSignOut && (
            <div className="px-1 py-1">
              <button
                type="button"
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded',
                  'hover:bg-destructive/10 text-destructive transition-colors'
                )}
                onClick={() => {
                  config.onSignOut?.();
                  handleClose();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

MainMenu.displayName = 'MainMenu';
