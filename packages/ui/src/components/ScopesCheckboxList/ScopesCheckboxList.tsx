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

  const isCategoryFullySelected = (category: string) => {
    const categoryScopes = scopesByCategory[category];
    if (!categoryScopes) return false;
    return categoryScopes.every((scope) => selectedScopes.includes(scope.id));
  };

  const toggleCategory = (category: string) => {
    if (disabled) return;

    const categoryScopes = scopesByCategory[category];
    if (!categoryScopes) return;

    const categoryIds = categoryScopes.map((s) => s.id);
    const allSelected = isCategoryFullySelected(category);

    if (allSelected) {
      // Clear all in category
      onChange(selectedScopes.filter((id) => !categoryIds.includes(id)));
    } else {
      // Select all in category
      const newScopes = new Set([...selectedScopes, ...categoryIds]);
      onChange([...newScopes]);
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
      {categories.map((category) => {
        const allSelected = isCategoryFullySelected(category);
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {category}
              </span>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                disabled={disabled}
                className={cn(
                  'text-xs text-muted-foreground hover:text-foreground transition-colors',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
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
                      onClick={() => toggleScope(scope.id)}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleScope(scope.id);
                          }
                        }}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className="font-medium truncate">
                        {scope.label}
                      </span>
                    </label>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
