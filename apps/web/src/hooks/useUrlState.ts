import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

export interface UseUrlStateOptions<T> {
  /** Default value when param is not in URL */
  defaultValue?: T;
  /** Parse string from URL to value (default: identity for strings) */
  parse?: (value: string | null) => T;
  /** Serialize value to string for URL. Return undefined to omit param. */
  serialize?: (value: T) => string | undefined;
  /** Debounce delay in ms (0 = no debounce, default: 0) */
  debounceMs?: number;
}

/**
 * Hook for syncing state with URL query parameters.
 *
 * @param param - The URL query parameter name
 * @param options - Configuration options
 * @returns [value, setValue, debouncedValue] - Current value, setter, and debounced value
 *
 * @example
 * // String with debounce (search input)
 * const [search, setSearch, debouncedSearch] = useUrlState('search', { debounceMs: 300 });
 *
 * @example
 * // Enum value
 * const [priority, setPriority] = useUrlState<Priority | undefined>('priority');
 *
 * @example
 * // Boolean
 * const [enabled, setEnabled] = useUrlState('enabled', {
 *   parse: (v) => v === 'true',
 *   serialize: (v) => v ? 'true' : undefined,
 * });
 */
export function useUrlState<T = string>(
  param: string,
  options: UseUrlStateOptions<T> = {}
): [T, (value: T) => void, T] {
  const { defaultValue, parse, serialize, debounceMs = 0 } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current value from URL
  const value = useMemo(() => {
    const rawValue = searchParams.get(param);

    if (parse) {
      return parse(rawValue);
    }

    // Default parsing: return raw value or default
    if (rawValue !== null) {
      return rawValue as T;
    }

    return (defaultValue ?? '') as T;
  }, [searchParams, param, parse, defaultValue]);

  // Debounced value
  const debouncedValue = useDebounce(value, debounceMs);

  // Setter that updates URL
  const setValue = useCallback(
    (newValue: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          let serialized: string | undefined;
          if (serialize) {
            serialized = serialize(newValue);
          } else {
            // Default serialization: convert to string, undefined/empty removes param
            const strValue = newValue as unknown;
            if (
              strValue === undefined ||
              strValue === null ||
              strValue === ''
            ) {
              serialized = undefined;
            } else {
              serialized = String(strValue);
            }
          }

          if (serialized === undefined) {
            next.delete(param);
          } else {
            next.set(param, serialized);
          }

          return next;
        },
        { replace: true }
      );
    },
    [param, serialize, setSearchParams]
  );

  return [value, setValue, debounceMs > 0 ? debouncedValue : value];
}
