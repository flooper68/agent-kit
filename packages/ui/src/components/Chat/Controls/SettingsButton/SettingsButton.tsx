import { forwardRef } from 'react';
import { IconButton } from '../../../IconButton';

export interface SettingsButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
}

export const SettingsButton = forwardRef<
  HTMLButtonElement,
  SettingsButtonProps
>(({ label = 'Settings', ...props }, ref) => {
  return (
    <IconButton
      ref={ref}
      icon={
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      }
      label={label}
      {...props}
    />
  );
});

SettingsButton.displayName = 'SettingsButton';
