import { forwardRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme, type Theme } from '../../theme';
import { IconButton, type IconButtonProps } from '../IconButton';

export interface ThemeToggleProps extends Omit<
  IconButtonProps,
  'icon' | 'label'
> {
  showSystemOption?: boolean;
}

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const labels: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system mode',
  system: 'Switch to light mode',
};

const labelsSimple: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to light mode',
  system: 'Switch to light mode',
};

const nextTheme: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const nextThemeSimple: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'light',
  system: 'light',
};

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, showSystemOption = true, ...props }, ref) => {
    const { theme, resolvedTheme, setTheme } = useTheme();

    const displayTheme = theme === 'system' ? 'system' : resolvedTheme;
    const next = showSystemOption ? nextTheme : nextThemeSimple;
    const label = showSystemOption ? labels : labelsSimple;

    return (
      <IconButton
        ref={ref}
        icon={icons[displayTheme]}
        label={label[theme]}
        onClick={() => setTheme(next[theme])}
        className={cn('transition-colors', className)}
        {...props}
      />
    );
  }
);

ThemeToggle.displayName = 'ThemeToggle';
