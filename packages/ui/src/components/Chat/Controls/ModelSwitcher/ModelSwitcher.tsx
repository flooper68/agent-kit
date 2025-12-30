import { forwardRef, useState } from 'react';
import { cn } from '../../../../lib/utils';
import type { ModelOption } from '../../../../types/chat';
import { ProviderIcon } from '../../ProviderIcons';

export interface ModelSwitcherProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  models: ModelOption[];
  value?: string;
  onChange?: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSwitcher = forwardRef<HTMLDivElement, ModelSwitcherProps>(
  ({ models, value, onChange, disabled, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedModel = models.find((m) => m.id === value) ?? models[0];

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-accent transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ProviderIcon
            provider={selectedModel?.provider ?? 'unknown'}
            size="sm"
          />
          <span className="font-medium">
            {selectedModel?.name ?? 'Select model'}
          </span>
          <svg
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-1 w-64 z-20 rounded-md border bg-popover shadow-md">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange?.(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors',
                    model.id === value && 'bg-accent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ProviderIcon provider={model.provider} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {model.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
);

ModelSwitcher.displayName = 'ModelSwitcher';
