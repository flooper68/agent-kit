import { useState, useEffect, useRef } from 'react';
import { formatDuration } from '../lib/time-utils';

export interface UseElapsedTimeOptions {
  /** Start time as Date.now() value */
  startTime?: number | null;
  /** Whether the timer should be actively counting */
  isRunning: boolean;
  /** Pre-calculated duration for completed sessions (takes precedence when not running) */
  completedDuration?: number | null;
}

export interface UseElapsedTimeReturn {
  /** Raw elapsed time in seconds */
  elapsedSeconds: number;
  /** Formatted elapsed time string (e.g., "5s" or "1m 23s"), or null if no time to display */
  formattedElapsed: string | null;
}

/**
 * Hook to track elapsed time while an operation is running.
 *
 * Features:
 * - Updates every second while isRunning is true
 * - Freezes the final elapsed time when isRunning becomes false
 * - Returns both raw seconds and formatted string
 *
 * @example
 * ```tsx
 * const { formattedElapsed } = useElapsedTime({
 *   startTime: streamingStartTime,
 *   isRunning: status === 'streaming',
 * });
 * ```
 */
export function useElapsedTime({
  startTime,
  isRunning,
  completedDuration,
}: UseElapsedTimeOptions): UseElapsedTimeReturn {
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState<number | null>(null);
  const elapsedRef = useRef(0);
  const wasRunningRef = useRef(false);

  // Determine if we should use completedDuration (skip interval setup in this case)
  const useCompletedDuration = completedDuration != null && !isRunning;

  useEffect(() => {
    // Skip interval setup if we're using completedDuration
    if (useCompletedDuration) return;

    if (isRunning && startTime) {
      wasRunningRef.current = true;
      setFinalElapsed(null);

      // Calculate initial elapsed time
      const initial = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(initial);
      elapsedRef.current = initial;

      const interval = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(newElapsed);
        elapsedRef.current = newElapsed;
      }, 1000);

      return () => clearInterval(interval);
    } else if (wasRunningRef.current && !isRunning) {
      // Freeze the final elapsed time when running stops
      if (elapsedRef.current > 0) {
        setFinalElapsed(elapsedRef.current);
      }
      wasRunningRef.current = false;
    }
  }, [isRunning, startTime, useCompletedDuration]);

  // Reset when startTime changes (new session)
  useEffect(() => {
    if (useCompletedDuration) return;
    if (startTime && !isRunning) {
      setElapsed(0);
    }
  }, [startTime, isRunning, useCompletedDuration]);

  // Reset finalElapsed when startTime is cleared (session switch)
  useEffect(() => {
    if (useCompletedDuration) return;
    if (!startTime) {
      setFinalElapsed(null);
      wasRunningRef.current = false;
    }
  }, [startTime, useCompletedDuration]);

  // If completedDuration is provided and not running, use it directly
  // This ensures stable display for completed sessions across page refreshes
  if (useCompletedDuration) {
    return {
      elapsedSeconds: completedDuration,
      formattedElapsed:
        completedDuration > 0 ? formatDuration(completedDuration) : null,
    };
  }

  const displayElapsed = finalElapsed ?? elapsed;

  // Don't show time if we haven't started counting
  if (displayElapsed === 0 && !startTime) {
    return { elapsedSeconds: 0, formattedElapsed: null };
  }

  return {
    elapsedSeconds: displayElapsed,
    formattedElapsed:
      displayElapsed > 0 ? formatDuration(displayElapsed) : null,
  };
}
