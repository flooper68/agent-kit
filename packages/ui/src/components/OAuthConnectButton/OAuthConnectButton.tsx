import { forwardRef } from 'react';
import { Loader2, LogOut, Link } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

export interface OAuthConnectButtonProps {
  provider: string;
  providerIcon?: React.ReactNode;
  isConnected: boolean;
  isLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  className?: string;
  disabled?: boolean;
}

export const OAuthConnectButton = forwardRef<
  HTMLButtonElement,
  OAuthConnectButtonProps
>(
  (
    {
      provider,
      providerIcon,
      isConnected,
      isLoading = false,
      onConnect,
      onDisconnect,
      className,
      disabled,
    },
    ref
  ) => {
    if (isLoading) {
      return (
        <Button
          ref={ref}
          variant="outline"
          disabled
          className={cn('min-w-[140px]', className)}
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      );
    }

    if (isConnected) {
      return (
        <Button
          ref={ref}
          variant="ghost"
          onClick={onDisconnect}
          disabled={disabled}
          className={cn('min-w-[140px]', className)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant="primary"
        onClick={onConnect}
        disabled={disabled}
        className={cn('min-w-[140px]', className)}
      >
        {providerIcon || <Link className="mr-2 h-4 w-4" />}
        {!providerIcon && `Connect ${provider}`}
        {providerIcon && <span className="ml-2">Connect {provider}</span>}
      </Button>
    );
  }
);

OAuthConnectButton.displayName = 'OAuthConnectButton';
