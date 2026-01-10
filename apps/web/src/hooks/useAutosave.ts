import { useCallback, useEffect, useRef } from 'react';

export interface UseAutosaveOptions<TData> {
  /** Current data to compare against last saved state */
  data: TData;
  /** Whether autosave is enabled (e.g., false during creation, true during editing) */
  enabled?: boolean;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Callback to perform the save operation. Call done() when save completes. */
  onSave: (data: TData, done: () => void) => void;
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
 * - Queues saves when a save is in-flight
 * - Cleans up timers on unmount
 *
 * @example
 * ```tsx
 * const autosave = useAutosave({
 *   data: formData,
 *   enabled: isEditing && !!id,
 *   onSave: (data, done) => {
 *     mutation.mutate(
 *       { id, ...data },
 *       {
 *         onSuccess: () => {
 *           autosave.lastSavedDataRef.current = data;
 *         },
 *         onSettled: done,
 *       }
 *     );
 *   },
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
}: UseAutosaveOptions<TData>): UseAutosaveReturn<TData> {
  // Track last saved state
  const lastSavedDataRef = useRef<TData | null>(null);

  // Track if a save is in-flight (controlled locally, not via React state)
  const isSavingRef = useRef(false);

  // Track if changes were made during a save
  const hasPendingChangesRef = useRef(false);

  // Store debounce timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs to latest values to avoid stale closures
  const dataRef = useRef(data);
  const enabledRef = useRef(enabled);
  const onSaveRef = useRef(onSave);

  // Ref to hold save function to avoid circular dependency
  const saveRef = useRef<() => void>(() => {});

  // Update refs on each render
  dataRef.current = data;
  enabledRef.current = enabled;
  onSaveRef.current = onSave;

  // Done callback - called by consumer when save completes
  const handleSaveComplete = useCallback(() => {
    isSavingRef.current = false;

    // If changes were queued during save, save again
    if (hasPendingChangesRef.current) {
      hasPendingChangesRef.current = false;
      // Use setTimeout to avoid potential call stack issues
      setTimeout(() => saveRef.current(), 0);
    }
  }, []);

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

    // If a save is in-flight, queue for later
    if (isSavingRef.current) {
      hasPendingChangesRef.current = true;
      return;
    }

    // Mark as saving BEFORE calling onSave to prevent race conditions
    isSavingRef.current = true;
    onSaveRef.current(currentData, handleSaveComplete);
  }, [handleSaveComplete]);

  // Keep saveRef updated
  saveRef.current = save;

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
      saveRef.current();
    }, debounceMs);
  }, [debounceMs]);

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
