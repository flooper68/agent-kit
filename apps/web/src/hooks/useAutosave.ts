import { useCallback, useEffect, useRef } from 'react';

export interface UseAutosaveOptions<TData> {
  /** Current data to compare against last saved state */
  data: TData;
  /** Whether autosave is enabled (e.g., false during creation, true during editing) */
  enabled?: boolean;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Callback to perform the save operation */
  onSave: (data: TData) => void;
  /** Whether a save operation is currently in progress */
  isPending?: boolean;
}

export interface UseAutosaveReturn<TData> {
  /** Trigger a debounced save (call this on blur events) */
  trigger: () => void;
  /** Reference to last saved data (for initialization) */
  lastSavedDataRef: React.MutableRefObject<TData | null>;
}

/**
 * Hook to handle debounced autosave functionality.
 *
 * Features:
 * - Debounces save calls (default 500ms)
 * - Tracks last saved state to detect actual changes
 * - Queues saves when mutation is pending
 * - Cleans up timers on unmount
 *
 * @example
 * ```tsx
 * const autosave = useAutosave({
 *   data: formData,
 *   enabled: isEditing && !!id,
 *   onSave: (data) => mutation.mutate({ id, ...data }),
 *   isPending: mutation.isPending,
 * });
 *
 * // Initialize last saved data when data loads
 * useEffect(() => {
 *   if (loadedData) {
 *     autosave.lastSavedDataRef.current = loadedData;
 *   }
 * }, [loadedData]);
 *
 * // Use trigger on blur events
 * <Input onBlur={autosave.trigger} />
 * ```
 */
export function useAutosave<TData>({
  data,
  enabled = true,
  debounceMs = 500,
  onSave,
  isPending = false,
}: UseAutosaveOptions<TData>): UseAutosaveReturn<TData> {
  // Track last saved state
  const lastSavedDataRef = useRef<TData | null>(null);

  // Track if a save is pending while mutation is in-flight
  const pendingSaveRef = useRef(false);

  // Store debounce timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs to latest values to avoid stale closures
  const dataRef = useRef(data);
  const enabledRef = useRef(enabled);
  const isPendingRef = useRef(isPending);
  const onSaveRef = useRef(onSave);

  // Update refs on each render
  dataRef.current = data;
  enabledRef.current = enabled;
  isPendingRef.current = isPending;
  onSaveRef.current = onSave;

  // Core save function
  const save = useCallback(() => {
    if (!enabledRef.current || lastSavedDataRef.current === null) {
      return;
    }

    const currentData = dataRef.current;

    // Compare current data with last saved data
    if (
      JSON.stringify(currentData) === JSON.stringify(lastSavedDataRef.current)
    ) {
      return; // No changes
    }

    // If a mutation is in progress, queue another save
    if (isPendingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // Call onSave with current data
    // Note: The caller should update lastSavedDataRef in their mutation's onSuccess
    onSaveRef.current(currentData);
  }, []);

  // Handle pending saves when mutation completes
  useEffect(() => {
    if (!isPending && pendingSaveRef.current) {
      pendingSaveRef.current = false;
      // Schedule another save to capture changes made during the save
      setTimeout(() => save(), 0);
    }
  }, [isPending, save]);

  // Debounced trigger function
  const trigger = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule save after debounce delay
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);
  }, [save, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    trigger,
    lastSavedDataRef,
  };
}
