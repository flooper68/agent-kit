import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';
import { Tooltip } from '../Tooltip/Tooltip';

export interface ScopeOption {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface ScopesCheckboxListProps {
  /** Available scopes with metadata */
  scopes: ScopeOption[];
  /** Currently selected scope IDs */
  selectedScopes: string[];
  /** Called when selection changes */
  onChange: (selectedScopes: string[]) => void;
  /** Disable all checkboxes */
  disabled?: boolean;
  /** Called when component loses focus */
  onBlur?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Checkbox list for selecting agent permission scopes.
 * Groups scopes by category with label and description for each.
 */
export function ScopesCheckboxList({
  scopes,
  selectedScopes,
  onChange,
  disabled = false,
  onBlur,
  className,
}: ScopesCheckboxListProps) {
  // Group scopes by category
  const scopesByCategory = scopes.reduce(
    (acc, scope) => {
      const category = scope.category;
      const existing = acc[category];
      if (!existing) {
        acc[category] = [scope];
      } else {
        existing.push(scope);
      }
      return acc;
    },
    {} as Record<string, ScopeOption[]>
  );

  const toggleScope = (scopeId: string) => {
    if (disabled) return;

    if (selectedScopes.includes(scopeId)) {
      onChange(selectedScopes.filter((s) => s !== scopeId));
    } else {
      onChange([...selectedScopes, scopeId]);
    }
  };

  const categories = Object.keys(scopesByCategory);

  if (scopes.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No scopes available
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} onBlur={onBlur}>
      {categories.map((category) => (
        <div key={category} className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </span>
          <div className="flex flex-wrap gap-2">
            {scopesByCategory[category]?.map((scope) => {
              const isSelected = selectedScopes.includes(scope.id);
              return (
                <Tooltip key={scope.id} content={scope.description}>
                  <label
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-1.5 border rounded-full cursor-pointer transition-colors text-xs w-fit',
                      isSelected
                        ? 'bg-primary/5 border-primary/50'
                        : 'hover:bg-muted/50 border-border',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-input bg-background'
                      )}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => toggleScope(scope.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleScope(scope.id);
                        }
                      }}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span
                      className="font-medium truncate"
                      onClick={() => toggleScope(scope.id)}
                    >
                      {scope.label}
                    </span>
                  </label>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
